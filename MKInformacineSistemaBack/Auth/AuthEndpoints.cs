using MKInformacineSistemaBack.Auth.Models;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Auth
{
    public static class AuthEndpoints
    {
        public static void AddAuthApi(this WebApplication app)
        {
            // register
            app.MapPost("api/accounts", async (UserManager<User> userManager, RegisterUserDto dto) =>
            {
                // check user exists
                var user = await userManager.FindByNameAsync(dto.UserName);
                if (user != null)
                    return Results.UnprocessableEntity("Username already taken");

                var newUser = new User()
                {
                    Email = dto.Email,
                    UserName = dto.UserName,
                };

                // TODO: wrap in transaction
                var createUserResult = await userManager.CreateAsync(newUser, dto.Password);
                if (!createUserResult.Succeeded)
                    return Results.UnprocessableEntity();

                await userManager.AddToRoleAsync(newUser, Roles.User);

                return Results.Created();
            });

            app.MapGet("api/session", async (JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext) =>
            {
                // Check if RefreshToken exists in cookies
                if (!httpContext.Request.Cookies.TryGetValue("RefreshToken", out var refreshToken))
                {
                    return Results.Unauthorized();
                }

                // Parse the RefreshToken to extract claims
                if (!jwtTokenService.TryParseRefreshToken(refreshToken, out var claims))
                {
                    return Results.Unauthorized();
                }

                // Extract SessionId and UserId from claims
                var sessionId = claims.FindFirstValue("SessionId");
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return Results.Unauthorized();
                }

                var userId = claims.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Results.Unauthorized();
                }

                // Validate the session in the database
                if (!await sessionService.IsSessionValidAsync(Guid.Parse(sessionId), refreshToken))
                {
                    return Results.Unauthorized();
                }

                // If everything is valid, return success
                return Results.Ok();
            });

            // login
            app.MapPost("api/login", async (UserManager<User> userManager, JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext, LoginDto dto) =>
            {
                // check user exists
                var user = await userManager.FindByNameAsync(dto.UserName);
                if (user == null)
                    return Results.UnprocessableEntity("User does not exist");

                var isPasswordValid = await userManager.CheckPasswordAsync(user, dto.Password);
                if (!isPasswordValid)
                    return Results.UnprocessableEntity("Username or password was incorrect.");

                var roles = await userManager.GetRolesAsync(user);

                var sessionId = Guid.NewGuid();
                var expiresAt = DateTime.UtcNow.AddDays(3);
                var accessToken = jwtTokenService.CreateAccessToken(user.UserName, user.Id, roles);
                var refreshToken = jwtTokenService.CreateRefreshToken(sessionId, user.Id, expiresAt);

                await sessionService.CreateSessionAsync(sessionId, user.Id, refreshToken, expiresAt);

                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.None,
                    Expires = expiresAt,
                    Secure = true
                };

                httpContext.Response.Cookies.Append("RefreshToken", refreshToken, cookieOptions);

                return Results.Ok(new SuccessfulLoginDto(accessToken));
            });

            app.MapPost("api/accessToken", async (UserManager<User> userManager, JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext) =>
            {
                if (!httpContext.Request.Cookies.TryGetValue("RefreshToken", out var refreshToken))
                {
                    return Results.UnprocessableEntity();
                }

                if (!jwtTokenService.TryParseRefreshToken(refreshToken, out var claims))
                {
                    return Results.UnprocessableEntity();
                }

                var sessionId = claims.FindFirstValue("SessionId");
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return Results.UnprocessableEntity();
                }

                var sessionIdAsGuid = Guid.Parse(sessionId);
                if (!await sessionService.IsSessionValidAsync(sessionIdAsGuid, refreshToken))
                {
                    return Results.UnprocessableEntity();
                }

                var userId = claims.FindFirstValue(JwtRegisteredClaimNames.Sub);
                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Results.UnprocessableEntity();
                }

                var roles = await userManager.GetRolesAsync(user);

                var expiresAt = DateTime.UtcNow.AddDays(3);
                var accessToken = jwtTokenService.CreateAccessToken(user.UserName, user.Id, roles);
                var newRefreshToken = jwtTokenService.CreateRefreshToken(sessionIdAsGuid, user.Id, expiresAt);

                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.None,
                    Expires = expiresAt,
                    Secure = true
                };

                httpContext.Response.Cookies.Append("RefreshToken", newRefreshToken, cookieOptions);

                await sessionService.ExtendSessionAsync(sessionIdAsGuid, newRefreshToken, expiresAt);

                return Results.Ok(new SuccessfulLoginDto(accessToken));
            });

            app.MapPost("api/logout", async (UserManager<User> userManager, JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext) =>
            {
                if (!httpContext.Request.Cookies.TryGetValue("RefreshToken", out var refreshToken))
                {
                    // Even if refresh token is not found, delete any cookie that might exist
                    DeleteRefreshTokenCookie(httpContext);
                    return Results.Ok(); // Return OK instead of error
                }

                if (!jwtTokenService.TryParseRefreshToken(refreshToken, out var claims))
                {
                    // Even if token is invalid, delete cookie
                    DeleteRefreshTokenCookie(httpContext);
                    return Results.Ok(); // Return OK instead of error
                }

                var sessionId = claims.FindFirstValue("SessionId");
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    // Even if session ID is missing, delete cookie
                    DeleteRefreshTokenCookie(httpContext);
                    return Results.Ok(); // Return OK instead of error
                }

                try
                {
                    await sessionService.InvalidateSessionAsync(Guid.Parse(sessionId));
                }
                catch
                {
                    // Log exception but continue to delete cookie
                }

                DeleteRefreshTokenCookie(httpContext);
                return Results.Ok();
            });

        }
        private static void DeleteRefreshTokenCookie(HttpContext httpContext)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.None,
                Secure = true,
                Expires = DateTime.Now.AddDays(-1), // Expire immediately
            };

            httpContext.Response.Cookies.Delete("RefreshToken", cookieOptions);
        }
        public record RegisterUserDto(string UserName, string Email, string Password);
        public record LoginDto(string UserName, string Password);
        public record SuccessfulLoginDto(string AccessToken);
    }
}
