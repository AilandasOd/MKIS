﻿using Microsoft.EntityFrameworkCore;
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
        public DbSet<ClubMembership> ClubMemberships { get; set; }

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

            modelBuilder.Entity<ClubMembership>()
            .HasOne(cm => cm.Club)
            .WithMany(c => c.Memberships)
            .HasForeignKey(cm => cm.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClubMembership>()
                .HasOne(cm => cm.Member)
                .WithMany()
                .HasForeignKey(cm => cm.MemberId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DrivenHunt>()
           .HasOne(dh => dh.Club)
           .WithMany(c => c.DrivenHunts)
           .HasForeignKey(dh => dh.ClubId)
           .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HuntingArea>()
            .HasOne(ha => ha.Club)
            .WithMany(c => c.HuntingAreas)
            .HasForeignKey(ha => ha.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

            // Existing configurations...
            // Configure spatial column for Club
            modelBuilder.Entity<Club>()
                .Property(c => c.HuntingAreaLocation)
                .HasColumnType("geometry (Point, 4326)");

            modelBuilder.Entity<Polygon>()
                .Property(p => p.CoordinatesJson)
                .HasColumnType("json"); // PostgreSQL supports this

            modelBuilder.Entity<Polygon>()
            .HasOne(p => p.Club)
            .WithMany(c => c.Polygons)
            .HasForeignKey(p => p.ClubId)
            .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
