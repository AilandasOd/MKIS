using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Models;
using MKInformacineSistemaBack.Auth.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace MKInformacineSistemaBack.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public DbSet<Polygon> Polygons { get; set; }
        public DbSet<Club> Clubs { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<HuntingArea> HuntingAreas { get; set; }
        public DbSet<Member> Members { get; set; }
        public DbSet<DrivenHunt> DrivenHunts { get; set; }
        public DbSet<DrivenHuntParticipant> DrivenHuntParticipants { get; set; }
        public DbSet<HuntedAnimal> HuntedAnimals { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User properties
            modelBuilder.Entity<User>()
                .Property(u => u.FirstName)
                .HasMaxLength(100);

            modelBuilder.Entity<User>()
                .Property(u => u.LastName)
                .HasMaxLength(100);

            // Configure the Member - User relationship
            modelBuilder.Entity<Member>()
                .HasOne(m => m.User)
                .WithOne()
                .HasForeignKey<Member>(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Existing configurations...
            // Configure spatial column for Club
            modelBuilder.Entity<Club>()
                .Property(c => c.HuntingAreaLocation)
                .HasColumnType("geometry (Point, 4326)");

            modelBuilder.Entity<Polygon>()
                .Property(p => p.CoordinatesJson)
                .HasColumnType("json"); // PostgreSQL supports this
        }
    }
}
