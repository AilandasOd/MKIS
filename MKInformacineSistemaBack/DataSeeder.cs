using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Auth.Models;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Models;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using System.Text.Json;

namespace MKInformacineSistemaBack.Server
{
    public class DataSeeder
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly GeometryFactory _geometryFactory;
        private readonly Random _random = new Random();

        public DataSeeder(
            ApplicationDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        }

        public async Task SeedAsync()
        {
            await SeedUsersAsync();
            await SeedClubsAsync();
            await SeedClubMembershipsAsync();
            await SeedHuntingAreasAsync();
            await SeedPolygonsAsync();
            await SeedDrivenHuntsAsync();
            await SeedBloodTestsAsync();
            await SeedPostsAsync();
            await SeedStatisticsAsync();
        }

        // Helper method to ensure all DateTimes are UTC
        private DateTime EnsureUtc(DateTime dateTime)
        {
            return dateTime.Kind == DateTimeKind.Utc
                ? dateTime
                : DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
        }

        private async Task SeedUsersAsync()
        {
            // Create test users with typical Lithuanian names
            var users = new List<User>
            {
                new User
                {
                    UserName = "jonas.lietuvis",
                    Email = "jonas@example.com",
                    FirstName = "Jonas",
                    LastName = "Lietuvis",
                    PhoneNumber = "+37061234567",
                    DateOfBirth = EnsureUtc(new DateTime(1985, 5, 15)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2010, 3, 10))
                },
                new User
                {
                    UserName = "petras.petraitis",
                    Email = "petras@example.com",
                    FirstName = "Petras",
                    LastName = "Petraitis",
                    PhoneNumber = "+37061234568",
                    DateOfBirth = EnsureUtc(new DateTime(1978, 8, 22)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2005, 7, 15))
                },
                new User
                {
                    UserName = "marius.jonaitis",
                    Email = "marius@example.com",
                    FirstName = "Marius",
                    LastName = "Jonaitis",
                    PhoneNumber = "+37061234569",
                    DateOfBirth = EnsureUtc(new DateTime(1990, 2, 10)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2015, 4, 5))
                },
                new User
                {
                    UserName = "tomas.tomauskas",
                    Email = "tomas@example.com",
                    FirstName = "Tomas",
                    LastName = "Tomauskas",
                    PhoneNumber = "+37061234570",
                    DateOfBirth = EnsureUtc(new DateTime(1982, 11, 7)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2008, 9, 20))
                },
                new User
                {
                    UserName = "antanas.kairys",
                    Email = "antanas@example.com",
                    FirstName = "Antanas",
                    LastName = "Kairys",
                    PhoneNumber = "+37061234571",
                    DateOfBirth = EnsureUtc(new DateTime(1975, 4, 1)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2000, 5, 12))
                },
                new User
                {
                    UserName = "darius.vaitkus",
                    Email = "darius@example.com",
                    FirstName = "Darius",
                    LastName = "Vaitkus",
                    PhoneNumber = "+37061234572",
                    DateOfBirth = EnsureUtc(new DateTime(1988, 7, 17)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2012, 6, 25))
                },
                new User
                {
                    UserName = "rimas.rimauskas",
                    Email = "rimas@example.com",
                    FirstName = "Rimas",
                    LastName = "Rimauskas",
                    PhoneNumber = "+37061234573",
                    DateOfBirth = EnsureUtc(new DateTime(1980, 9, 30)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2009, 8, 5))
                },
                new User
                {
                    UserName = "vilija.kazlauskiene",
                    Email = "vilija@example.com",
                    FirstName = "Vilija",
                    LastName = "Kazlauskienė",
                    PhoneNumber = "+37061234574",
                    DateOfBirth = EnsureUtc(new DateTime(1987, 12, 12)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2014, 11, 15))
                },
                new User
                {
                    UserName = "giedre.paulauskiene",
                    Email = "giedre@example.com",
                    FirstName = "Giedrė",
                    LastName = "Paulauskienė",
                    PhoneNumber = "+37061234575",
                    DateOfBirth = EnsureUtc(new DateTime(1992, 3, 25)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2017, 2, 8))
                },
                new User
                {
                    UserName = "kotryna.petraityte",
                    Email = "kotryna@example.com",
                    FirstName = "Kotryna",
                    LastName = "Petraitytė",
                    PhoneNumber = "+37061234576",
                    DateOfBirth = EnsureUtc(new DateTime(1993, 10, 5)),
                    HuntingTicketIssueDate = EnsureUtc(new DateTime(2018, 9, 10))
                }
            };

            // Create users and assign roles
            foreach (var user in users)
            {
                var existingUser = await _userManager.FindByNameAsync(user.UserName);
                if (existingUser == null)
                {
                    var result = await _userManager.CreateAsync(user, "Password123!");
                    if (result.Succeeded)
                    {
                        // Assign roles - make first 3 admins, all are hunters
                        if (users.IndexOf(user) < 3)
                        {
                            await _userManager.AddToRolesAsync(user, new[] { Roles.Admin, Roles.User, Roles.Hunter });
                        }
                        else
                        {
                            await _userManager.AddToRolesAsync(user, new[] { Roles.User, Roles.Hunter });
                        }
                    }
                }
            }
        }

        private async Task SeedClubsAsync()
        {
            if (await _context.Clubs.AnyAsync())
                return;

            // Create sample hunting clubs
            var clubs = new[]
            {
                new Club
                {
                    Name = "Šiaulių medžiotojų klubas",
                    Description = "Vienas seniausių Šiaulių apskrities medžiotojų klubų, įkurtas 1990 m. Klubo nariai garsėja aukšta medžioklės kultūra ir tradicijomis.",
                    ResidenceAddress = "Vilniaus g. 45, Šiauliai",
                    HuntingAreaLocation = _geometryFactory.CreatePoint(new Coordinate(23.349903007765427, 56.10857764750518)),
                    UseResidenceAsCenter = true,
                    LogoUrl = "/uploads/clubs/siauliu_logo.png", // imaginary path
                    FoundedDate = EnsureUtc(new DateTime(1990, 5, 12)),
                    ContactEmail = "siauliai.hunters@example.com",
                    ContactPhone = "+37041123456"
                },
                new Club
                {
                    Name = "Kauno girių sargai",
                    Description = "Medžiotojų klubas, veikiantis Kauno apylinkėse. Mūsų tikslas - užtikrinti tvarų miško išteklių naudojimą ir gyvūnų populiacijos balansą.",
                    ResidenceAddress = "Kęstučio g. 15, Kaunas",
                    HuntingAreaLocation = _geometryFactory.CreatePoint(new Coordinate(23.9036, 54.8985)),
                    UseResidenceAsCenter = true,
                    LogoUrl = "/uploads/clubs/kauno_logo.png", // imaginary path
                    FoundedDate = EnsureUtc(new DateTime(1995, 3, 22)),
                    ContactEmail = "kaunas.hunters@example.com",
                    ContactPhone = "+37037123456"
                },
                new Club
                {
                    Name = "Vilniaus laukinė gamta",
                    Description = "Vilniaus apskrityje veikiantis medžiotojų klubas, propaguojantis atsakingą medžioklę ir gamtos apsaugą.",
                    ResidenceAddress = "Gedimino pr. 28, Vilnius",
                    HuntingAreaLocation = _geometryFactory.CreatePoint(new Coordinate(25.2797, 54.6872)),
                    UseResidenceAsCenter = true,
                    LogoUrl = "/uploads/clubs/vilniaus_logo.png", // imaginary path
                    FoundedDate = EnsureUtc(new DateTime(1998, 8, 15)),
                    ContactEmail = "vilnius.hunters@example.com",
                    ContactPhone = "+37052123456"
                }
            };

            await _context.Clubs.AddRangeAsync(clubs);
            await _context.SaveChangesAsync();
        }

        private async Task SeedClubMembershipsAsync()
        {
            if (await _context.ClubMemberships.AnyAsync())
                return;

            var users = await _userManager.Users.ToListAsync();
            var clubs = await _context.Clubs.ToListAsync();

            var memberships = new List<ClubMembership>();

            // Add all users to the first club with different roles
            foreach (var user in users)
            {
                string role = "Member";
                if (users.IndexOf(user) == 0)
                    role = "Owner";
                else if (users.IndexOf(user) == 1 || users.IndexOf(user) == 2)
                    role = "Admin";

                memberships.Add(new ClubMembership
                {
                    ClubId = clubs[0].Id,
                    UserId = user.Id,
                    Role = role,
                    JoinDate = EnsureUtc(DateTime.UtcNow.AddYears(-3).AddDays(_random.Next(1000))),
                    IsActive = true
                });
            }

            // Add some users to the second club
            for (int i = 2; i < users.Count; i++)
            {
                if (i % 2 == 0)
                {
                    string role = "Member";
                    if (i == 2)
                        role = "Owner";
                    else if (i == 4)
                        role = "Admin";

                    memberships.Add(new ClubMembership
                    {
                        ClubId = clubs[1].Id,
                        UserId = users[i].Id,
                        Role = role,
                        JoinDate = EnsureUtc(DateTime.UtcNow.AddYears(-2).AddDays(_random.Next(700))),
                        IsActive = true
                    });
                }
            }

            // Add some users to the third club
            for (int i = 1; i < users.Count; i++)
            {
                if (i % 3 == 0)
                {
                    string role = "Member";
                    if (i == 3)
                        role = "Owner";
                    else if (i == 6)
                        role = "Admin";

                    memberships.Add(new ClubMembership
                    {
                        ClubId = clubs[2].Id,
                        UserId = users[i].Id,
                        Role = role,
                        JoinDate = EnsureUtc(DateTime.UtcNow.AddYears(-1).AddDays(_random.Next(365))),
                        IsActive = true
                    });
                }
            }

            await _context.ClubMemberships.AddRangeAsync(memberships);
            await _context.SaveChangesAsync();
        }

        private async Task SeedHuntingAreasAsync()
        {
            if (await _context.HuntingAreas.AnyAsync())
                return;

            var clubs = await _context.Clubs.ToListAsync();

            var areas = new List<HuntingArea>();

            // Šiaulių club - main hunting area
            areas.Add(new HuntingArea
            {
                Name = "Šiaulių apylinkės",
                ClubId = clubs[0].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 56.10857764750518, Lng = 23.349903007765427 },
                    new { Lat = 56.11857764750518, Lng = 23.359903007765427 },
                    new { Lat = 56.12857764750518, Lng = 23.369903007765427 },
                    new { Lat = 56.13857764750518, Lng = 23.379903007765427 },
                    new { Lat = 56.12857764750518, Lng = 23.389903007765427 },
                    new { Lat = 56.11857764750518, Lng = 23.379903007765427 },
                    new { Lat = 56.10857764750518, Lng = 23.349903007765427 }
                })
            });

            // Kauno club - main hunting area
            areas.Add(new HuntingArea
            {
                Name = "Kauno miškai",
                ClubId = clubs[1].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 54.8985, Lng = 23.9036 },
                    new { Lat = 54.9085, Lng = 23.9136 },
                    new { Lat = 54.9185, Lng = 23.9236 },
                    new { Lat = 54.9085, Lng = 23.9336 },
                    new { Lat = 54.8985, Lng = 23.9236 },
                    new { Lat = 54.8985, Lng = 23.9036 }
                })
            });

            // Vilniaus club - main hunting area
            areas.Add(new HuntingArea
            {
                Name = "Vilniaus apylinkės",
                ClubId = clubs[2].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 54.6872, Lng = 25.2797 },
                    new { Lat = 54.6972, Lng = 25.2897 },
                    new { Lat = 54.7072, Lng = 25.2997 },
                    new { Lat = 54.6972, Lng = 25.3097 },
                    new { Lat = 54.6872, Lng = 25.2997 },
                    new { Lat = 54.6872, Lng = 25.2797 }
                })
            });

            await _context.HuntingAreas.AddRangeAsync(areas);
            await _context.SaveChangesAsync();
        }

        private async Task SeedPolygonsAsync()
        {
            if (await _context.Polygons.AnyAsync())
                return;

            var clubs = await _context.Clubs.ToListAsync();

            var polygons = new List<Models.Polygon>();

            // Šiaulių club - several polygons
            polygons.Add(new Models.Polygon
            {
                Name = "Šiaulių ežero plotas",
                ClubId = clubs[0].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 56.10057764750518, Lng = 23.339903007765427 },
                    new { Lat = 56.10557764750518, Lng = 23.349903007765427 },
                    new { Lat = 56.10557764750518, Lng = 23.359903007765427 },
                    new { Lat = 56.10057764750518, Lng = 23.349903007765427 },
                    new { Lat = 56.10057764750518, Lng = 23.339903007765427 }
                }),
                CreatedAt = EnsureUtc(DateTime.UtcNow.AddMonths(-11))
            });

            polygons.Add(new Models.Polygon
            {
                Name = "Šiaulių miško plotas",
                ClubId = clubs[0].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 56.11057764750518, Lng = 23.369903007765427 },
                    new { Lat = 56.11557764750518, Lng = 23.379903007765427 },
                    new { Lat = 56.11557764750518, Lng = 23.389903007765427 },
                    new { Lat = 56.11057764750518, Lng = 23.379903007765427 },
                    new { Lat = 56.11057764750518, Lng = 23.369903007765427 }
                }),
                CreatedAt = EnsureUtc(DateTime.UtcNow.AddMonths(-10))
            });

            // Kauno club - one polygon
            polygons.Add(new Models.Polygon
            {
                Name = "Kauno rezervatas",
                ClubId = clubs[1].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 54.8885, Lng = 23.8936 },
                    new { Lat = 54.8985, Lng = 23.9036 },
                    new { Lat = 54.8985, Lng = 23.9136 },
                    new { Lat = 54.8885, Lng = 23.9036 },
                    new { Lat = 54.8885, Lng = 23.8936 }
                }),
                CreatedAt = EnsureUtc(DateTime.UtcNow.AddMonths(-9))
            });

            // Vilniaus club - one polygon
            polygons.Add(new Models.Polygon
            {
                Name = "Vilniaus miško plotas",
                ClubId = clubs[2].Id,
                CoordinatesJson = JsonSerializer.Serialize(new List<object>
                {
                    new { Lat = 54.6772, Lng = 25.2697 },
                    new { Lat = 54.6872, Lng = 25.2797 },
                    new { Lat = 54.6872, Lng = 25.2897 },
                    new { Lat = 54.6772, Lng = 25.2797 },
                    new { Lat = 54.6772, Lng = 25.2697 }
                }),
                CreatedAt = EnsureUtc(DateTime.UtcNow.AddMonths(-8))
            });

            await _context.Polygons.AddRangeAsync(polygons);
            await _context.SaveChangesAsync();
        }

        private async Task SeedDrivenHuntsAsync()
        {
            if (await _context.DrivenHunts.AnyAsync())
                return;

            var clubs = await _context.Clubs.ToListAsync();
            var memberships = await _context.ClubMemberships.ToListAsync();

            var drivenHunts = new List<DrivenHunt>();
            var participants = new List<DrivenHuntParticipant>();
            var animals = new List<HuntedAnimal>();

            foreach (var club in clubs)
            {
                // Get club members
                var clubMembers = memberships.Where(m => m.ClubId == club.Id && m.IsActive).ToList();
                if (clubMembers.Count == 0)
                    continue;

                // Get an admin or owner to be the leader
                var leader = clubMembers.FirstOrDefault(m => m.Role == "Owner") ??
                            clubMembers.FirstOrDefault(m => m.Role == "Admin") ??
                            clubMembers.First();

                // Create a few completed driven hunts
                for (int i = 0; i < 3; i++)
                {
                    var hunt = new DrivenHunt
                    {
                        Name = $"{club.Name} - Varyminė medžioklė {i + 1}",
                        Location = $"Plotas {i + 1}",
                        Date = EnsureUtc(DateTime.UtcNow.AddMonths(-3).AddDays(i * 15)),
                        Game = GetRandomGame(),
                        LeaderId = leader.UserId,
                        ClubId = club.Id,
                        IsCompleted = true,
                        CompletedDate = EnsureUtc(DateTime.UtcNow.AddMonths(-3).AddDays(i * 15 + 1))
                    };
                    drivenHunts.Add(hunt);
                }

                // Create one upcoming driven hunt
                drivenHunts.Add(new DrivenHunt
                {
                    Name = $"{club.Name} - Būsima varyminė medžioklė",
                    Location = "Naujas plotas",
                    Date = EnsureUtc(DateTime.UtcNow.AddDays(10)),
                    Game = "Dar nežinoma",
                    LeaderId = leader.UserId,
                    ClubId = club.Id,
                    IsCompleted = false
                });
            }

            await _context.DrivenHunts.AddRangeAsync(drivenHunts);
            await _context.SaveChangesAsync();

            // Now add participants to completed hunts
            var completedHunts = drivenHunts.Where(h => h.IsCompleted).ToList();
            foreach (var hunt in completedHunts)
            {
                var clubMembers = memberships.Where(m => m.ClubId == hunt.ClubId && m.IsActive).ToList();
                int participantCount = _random.Next(3, clubMembers.Count + 1);

                // Shuffle members
                var shuffledMembers = clubMembers.OrderBy(x => _random.Next()).Take(participantCount).ToList();

                foreach (var member in shuffledMembers)
                {
                    var shotsTaken = _random.Next(0, 10);
                    var shotsHit = _random.Next(0, shotsTaken + 1);

                    var participant = new DrivenHuntParticipant
                    {
                        DrivenHuntId = hunt.Id,
                        UserId = member.UserId,
                        ShotsTaken = shotsTaken,
                        ShotsHit = shotsHit
                    };
                    participants.Add(participant);

                    // Add hunted animals for some participants randomly
                    if (_random.Next(0, 3) == 0 && shotsHit > 0)
                    {
                        var animalCount = _random.Next(1, shotsHit + 1);
                        var animal = new HuntedAnimal
                        {
                            ParticipantId = 0, // Will be set after participants are saved
                            AnimalType = GetRandomAnimalType(),
                            Count = animalCount
                        };
                        animals.Add(animal);
                    }
                }
            }

            // Add some participants to upcoming hunts
            var upcomingHunts = drivenHunts.Where(h => !h.IsCompleted).ToList();
            foreach (var hunt in upcomingHunts)
            {
                var clubMembers = memberships.Where(m => m.ClubId == hunt.ClubId && m.IsActive).ToList();
                int participantCount = _random.Next(2, clubMembers.Count);

                // Shuffle members
                var shuffledMembers = clubMembers.OrderBy(x => _random.Next()).Take(participantCount).ToList();

                foreach (var member in shuffledMembers)
                {
                    var participant = new DrivenHuntParticipant
                    {
                        DrivenHuntId = hunt.Id,
                        UserId = member.UserId,
                        ShotsTaken = 0,
                        ShotsHit = 0
                    };
                    participants.Add(participant);
                }
            }

            await _context.DrivenHuntParticipants.AddRangeAsync(participants);
            await _context.SaveChangesAsync();

            // Now link animals to participants
            int animalIndex = 0;
            foreach (var hunt in completedHunts)
            {
                var huntParticipants = await _context.DrivenHuntParticipants
                    .Where(p => p.DrivenHuntId == hunt.Id)
                    .ToListAsync();

                foreach (var participant in huntParticipants)
                {
                    if (animalIndex < animals.Count && _random.Next(0, 3) == 0)
                    {
                        animals[animalIndex].ParticipantId = participant.Id;
                        animalIndex++;
                    }
                }
            }

            await _context.HuntedAnimals.AddRangeAsync(animals);
            await _context.SaveChangesAsync();
        }

        private async Task SeedBloodTestsAsync()
        {
            if (await _context.BloodTests.AnyAsync())
                return;

            var clubs = await _context.Clubs.ToListAsync();
            var memberships = await _context.ClubMemberships.ToListAsync();

            var bloodTests = new List<BloodTest>();
            var participants = new List<BloodTestParticipant>();

            foreach (var club in clubs)
            {
                // Get club members
                var clubMembers = memberships.Where(m => m.ClubId == club.Id && m.IsActive).ToList();
                if (clubMembers.Count == 0)
                    continue;

                // Create a few blood tests with different statuses
                var statuses = new[] { "Patvirtinta", "Laukiama", "Netinkamas" };
                foreach (var status in statuses)
                {
                    var test = new BloodTest
                    {
                        TestName = "Šerno kraujo tyrimai",
                        AnimalType = "Šernas",
                        DateHunted = EnsureUtc(DateTime.UtcNow.AddDays(-_random.Next(30, 60))),
                        TestStartDate = EnsureUtc(DateTime.UtcNow.AddDays(-_random.Next(20, 30))),
                        Status = status,
                        CompletedDate = status == "Laukiama" ? null : EnsureUtc(DateTime.UtcNow.AddDays(-_random.Next(1, 10))),
                        Description = $"Tyrimai atiduoti, dėl vykstančio AKM. Statusas: {status}",
                        ClubId = club.Id
                    };
                    bloodTests.Add(test);
                }
            }

            await _context.BloodTests.AddRangeAsync(bloodTests);
            await _context.SaveChangesAsync();

            // Now add participants to blood tests
            foreach (var test in bloodTests)
            {
                var clubMembers = memberships.Where(m => m.ClubId == test.ClubId && m.IsActive).ToList();
                int participantCount = _random.Next(1, 3);

                // Shuffle members
                var shuffledMembers = clubMembers.OrderBy(x => _random.Next()).Take(participantCount).ToList();

                foreach (var member in shuffledMembers)
                {
                    var participant = new BloodTestParticipant
                    {
                        BloodTestId = test.Id,
                        UserId = member.UserId
                    };
                    participants.Add(participant);
                }
            }

            await _context.BloodTestParticipants.AddRangeAsync(participants);
            await _context.SaveChangesAsync();
        }

        private async Task SeedPostsAsync()
        {
            if (await _context.Posts.AnyAsync())
                return;

            var clubs = await _context.Clubs.ToListAsync();
            var memberships = await _context.ClubMemberships.ToListAsync();

            var posts = new List<Post>();

            foreach (var club in clubs)
            {
                // Get club members
                var clubMembers = memberships.Where(m => m.ClubId == club.Id && m.IsActive).ToList();
                if (clubMembers.Count == 0)
                    continue;

                // Create 3-5 general posts
                int generalPostCount = _random.Next(3, 6);
                for (int i = 0; i < generalPostCount; i++)
                {
                    var member = clubMembers[_random.Next(clubMembers.Count)];
                    posts.Add(new Post
                    {
                        Type = "Įrašas",
                        Title = $"Naujienos iš {club.Name} #{i + 1}",
                        Description = GetRandomPostDescription(),
                        CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 90)),
                        ImageUrl = i % 2 == 0 ? $"/uploads/posts/post_{club.Id}_{i + 1}.jpg" : "", // Some posts with, some without images
                        AuthorId = member.UserId,
                        ClubId = club.Id
                    });
                }

                // Create 2-4 hunted animal posts
                int animalPostCount = _random.Next(2, 5);
                for (int i = 0; i < animalPostCount; i++)
                {
                    var member = clubMembers[_random.Next(clubMembers.Count)];
                    var animalType = GetRandomAnimalType();
                    posts.Add(new Post
                    {
                        Type = "Sumedžiotas žvėris",
                        Title = $"Sumedžiotas {animalType.ToLower()}",
                        Description = $"Sėkmingai sumedžiotas {animalType.ToLower()} {club.Name} teritorijoje. Svoris apie {_random.Next(20, 150)} kg.",
                        CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 60)),
                        ImageUrl = $"/uploads/posts/animal_{club.Id}_{i + 1}.jpg", // All animal posts have images
                        AnimalType = animalType,
                        HuntedDate = DateTime.UtcNow.AddDays(-_random.Next(1, 60)),
                        AuthorId = member.UserId,
                        ClubId = club.Id
                    });
                }
            }

            await _context.Posts.AddRangeAsync(posts);
            await _context.SaveChangesAsync();
        }

        private async Task SeedStatisticsAsync()
        {
            // Generate club statistics and user statistics based on driven hunts
            await SeedClubStatisticsAsync();
            await SeedUserStatisticsAsync();
        }

        private async Task SeedClubStatisticsAsync()
        {
            if (await _context.ClubStatistics.AnyAsync())
                return;

            var clubs = await _context.Clubs.ToListAsync();
            var clubStats = new List<ClubStatistics>();

            foreach (var club in clubs)
            {
                // Count driven hunts
                int totalDrivenHunts = await _context.DrivenHunts
                    .CountAsync(h => h.ClubId == club.Id);

                int completedDrivenHunts = await _context.DrivenHunts
                    .CountAsync(h => h.ClubId == club.Id && h.IsCompleted);

                // Calculate shots data
                var shotsData = await _context.DrivenHuntParticipants
                    .Include(p => p.DrivenHunt)
                    .Where(p => p.DrivenHunt.ClubId == club.Id && p.DrivenHunt.IsCompleted)
                    .GroupBy(p => 1) // Group all together
                    .Select(g => new
                    {
                        TotalTaken = g.Sum(p => p.ShotsTaken),
                        TotalHit = g.Sum(p => p.ShotsHit)
                    })
                    .FirstOrDefaultAsync();

                int totalShotsTaken = shotsData?.TotalTaken ?? 0;
                int totalShotsHit = shotsData?.TotalHit ?? 0;

                // Count members
                int activeMembers = await _context.ClubMemberships
                    .CountAsync(cm => cm.ClubId == club.Id && cm.IsActive);

                // Gather hunted animals data
                var huntedAnimals = await _context.HuntedAnimals
                    .Include(a => a.Participant)
                        .ThenInclude(p => p.DrivenHunt)
                    .Where(a => a.Participant.DrivenHunt.ClubId == club.Id)
                    .GroupBy(a => a.AnimalType)
                    .Select(g => new
                    {
                        AnimalType = g.Key,
                        Count = g.Sum(a => a.Count)
                    })
                    .ToListAsync();

                var animalsDict = huntedAnimals.ToDictionary(
                    a => a.AnimalType,
                    a => a.Count);

                // Get top hunters
                var topHunters = await _context.HuntedAnimals
                    .Include(a => a.Participant)
                        .ThenInclude(p => p.DrivenHunt)
                    .Include(a => a.Participant)
                        .ThenInclude(p => p.User)
                    .Where(a => a.Participant.DrivenHunt.ClubId == club.Id)
                    .GroupBy(a => new {
                        a.Participant.UserId,
                        FirstName = a.Participant.User.FirstName,
                        LastName = a.Participant.User.LastName
                    })
                    .Select(g => new
                    {
                        UserId = g.Key.UserId,
                        Name = $"{g.Key.FirstName} {g.Key.LastName}",
                        Count = g.Sum(a => a.Count)
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToListAsync();

                // Create club statistics
                var clubStat = new ClubStatistics
                {
                    ClubId = club.Id,
                    Year = DateTime.UtcNow.Year,
                    TotalDrivenHunts = totalDrivenHunts,
                    CompletedDrivenHunts = completedDrivenHunts,
                    AnimalsHuntedJson = JsonSerializer.Serialize(animalsDict),
                    TotalShotsTaken = totalShotsTaken,
                    TotalShotsHit = totalShotsHit,
                    ActiveMembersCount = activeMembers,
                    TopHuntersJson = JsonSerializer.Serialize(topHunters),
                    LastUpdated = DateTime.UtcNow
                };

                clubStats.Add(clubStat);
            }

            await _context.ClubStatistics.AddRangeAsync(clubStats);
            await _context.SaveChangesAsync();
        }

        private async Task SeedUserStatisticsAsync()
        {
            if (await _context.UserStatistics.AnyAsync())
                return;

            var memberships = await _context.ClubMemberships
                .Where(cm => cm.IsActive)
                .ToListAsync();

            var userStats = new List<UserStatistics>();

            foreach (var membership in memberships)
            {
                // Count participated hunts
                var participatedHunts = await _context.DrivenHuntParticipants
                    .Include(p => p.DrivenHunt)
                    .CountAsync(p =>
                        p.UserId == membership.UserId &&
                        p.DrivenHunt.ClubId == membership.ClubId &&
                        p.DrivenHunt.IsCompleted);

                // Count led hunts
                var ledHunts = await _context.DrivenHunts
                    .CountAsync(h =>
                        h.LeaderId == membership.UserId &&
                        h.ClubId == membership.ClubId &&
                        h.IsCompleted);

                // Calculate activity percentage
                var totalCompletedHunts = await _context.DrivenHunts
                    .CountAsync(h => h.ClubId == membership.ClubId && h.IsCompleted);

                int activityPercentage = totalCompletedHunts > 0
                    ? (int)Math.Round((double)participatedHunts / totalCompletedHunts * 100)
                    : 0;

                // Get shots data
                var shotsData = await _context.DrivenHuntParticipants
                    .Include(p => p.DrivenHunt)
                    .Where(p =>
                        p.UserId == membership.UserId &&
                        p.DrivenHunt.ClubId == membership.ClubId &&
                        p.DrivenHunt.IsCompleted)
                    .GroupBy(p => 1) // Group all together
                    .Select(g => new
                    {
                        ShotsTaken = g.Sum(p => p.ShotsTaken),
                        ShotsHit = g.Sum(p => p.ShotsHit)
                    })
                    .FirstOrDefaultAsync();

                int shotsTaken = shotsData?.ShotsTaken ?? 0;
                int shotsHit = shotsData?.ShotsHit ?? 0;

                // Get hunted animals
                var huntedAnimals = await _context.HuntedAnimals
                    .Include(a => a.Participant)
                    .Where(a =>
                        a.Participant.UserId == membership.UserId &&
                        a.Participant.DrivenHunt.ClubId == membership.ClubId)
                    .GroupBy(a => a.AnimalType)
                    .Select(g => new
                    {
                        AnimalType = g.Key,
                        Count = g.Sum(a => a.Count)
                    })
                    .ToListAsync();

                var animalsDict = huntedAnimals.ToDictionary(
                    a => a.AnimalType,
                    a => a.Count);

                // Create user statistics
                var userStat = new UserStatistics
                {
                    UserId = membership.UserId,
                    ClubId = membership.ClubId,
                    Year = DateTime.UtcNow.Year,
                    DrivenHuntsParticipated = participatedHunts,
                    DrivenHuntsLed = ledHunts,
                    ActivityPercentage = activityPercentage,
                    AnimalsHuntedJson = JsonSerializer.Serialize(animalsDict),
                    ShotsTaken = shotsTaken,
                    ShotsHit = shotsHit,
                    LastUpdated = DateTime.UtcNow
                };

                userStats.Add(userStat);
            }

            await _context.UserStatistics.AddRangeAsync(userStats);
            await _context.SaveChangesAsync();
        }

        private string GetRandomGame()
        {
            var games = new[]
            {
                "Šernai",
                "Elniai",
                "Stirnos",
                "Lapės",
                "Šernai, stirnos",
                "Stirnos, lapės",
                "Šernai, stirnos, lapės",
                "Šernai, lapės",
                "Įvairūs žvėrys"
            };

            return games[_random.Next(games.Length)];
        }

        private string GetRandomAnimalType()
        {
            var animals = new[]
            {
                "Šernas",
                "Briedis",
                "Stirna",
                "Lapė",
                "Danielius",
                "Taurusis elnias",
                "Pilkasis kiškis",
                "Mangutas"
            };

            return animals[_random.Next(animals.Length)];
        }

        private string GetRandomPostDescription()
        {
            var descriptions = new[]
            {
                "Norime pranešti, kad artėjant medžioklės sezonui, klubo nariai aktyviai ruošiasi. Surengta keletas pasitarimų, sutvarkyta įranga, apžiūrėtos teritorijos.",
                "Praėjusią savaitę klubo nariai dalyvavo medžioklės taisyklių mokymuose. Atnaujinome žinias apie saugos reikalavimus ir medžioklės etiketą.",
                "Klubo narių susirinkime buvo aptartos metinės ataskaitos ir planai ateinantiems metams. Dėkojame visiems už aktyvų dalyvavimą!",
                "Kviečiame klubo narius į visuotinį susirinkimą. Bus aptariami svarbūs klausimai - medžioklės plotų priežiūra, būsimų medžioklių planas.",
                "Norime pasidžiaugti sėkminga vakar vykusia varymine medžiokle. Klubo nariai puikiai pasirodė, laikėsi visų taisyklių ir sėkmingai užbaigė dieną.",
                "Informuojame, kad atnaujinta bokštelių ir šėryklų informacija mūsų sistemoje. Kviečiame narius patikrinti ir pasiūlyti pakeitimus, jei tokių reikia.",
                "Dėkojame klubo nariams už aktyvų dalyvavimą aplinkos tvarkymo akcijoje. Bendromis jėgomis sutvarkėme teritoriją ir paruošėme ją būsimai medžioklės sezonui."
            };

            return descriptions[_random.Next(descriptions.Length)];
        }
    }
}