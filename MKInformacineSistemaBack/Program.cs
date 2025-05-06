using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Auth;
using MKInformacineSistemaBack.Auth.Models;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Server;
using MKInformacineSistemaBack.Server.Auth;
using MKInformacineSistemaBack.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.UseNetTopologySuite()
    )
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddTransient<JwtTokenService>();
builder.Services.AddTransient<SessionService>();
builder.Services.AddScoped<AuthSeeder>();
builder.Services.AddScoped<DataSeeder>(); // Add DataSeeder
builder.Services.AddScoped<MemberActivityService>();
builder.Services.AddScoped<StatisticsService>();

builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Ensure these settings match how your token is created
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"]))
    };
});

builder.Services.Configure<IdentityOptions>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = false; // Make this less strict
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 6; // Reduce this from the default
    options.Password.RequiredUniqueChars = 1;
});

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (string.IsNullOrEmpty(builder.Environment.WebRootPath))
{
    builder.Environment.WebRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    // Create the wwwroot directory if it doesn't exist
    Directory.CreateDirectory(builder.Environment.WebRootPath);
}

app.UseStaticFiles();

// Create required directories if they don't exist
var uploadsDir = Path.Combine(builder.Environment.WebRootPath, "uploads");
Directory.CreateDirectory(uploadsDir);

var avatarsDir = Path.Combine(uploadsDir, "avatars");
Directory.CreateDirectory(avatarsDir);

var clubsDir = Path.Combine(uploadsDir, "clubs");
Directory.CreateDirectory(clubsDir);

var postsDir = Path.Combine(uploadsDir, "posts");
Directory.CreateDirectory(postsDir);

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();

    // Setup database
    context.Database.Migrate();

    // Seed auth data (roles, admin user)
    var authSeeder = scope.ServiceProvider.GetRequiredService<AuthSeeder>();
    await authSeeder.SeedAsync();

    // Seed application data
    var dataSeeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
    await dataSeeder.SeedAsync();
}

app.AddAuthApi();

app.UseHttpsRedirection();
app.UseResponseCaching();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();