namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class PostDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // "Įrašas" or "Sumedžiotas žvėris"
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? AnimalType { get; set; }
        public DateTime? HuntedDate { get; set; }

        // Author information
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorAvatarUrl { get; set; } = string.Empty;

        // Club information
        public int ClubId { get; set; }
        public string ClubName { get; set; } = string.Empty;

        // Statistics (for frontend display)
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool UserHasLiked { get; set; } // Whether the current user has liked this post
    }

    public class CreatePostDto
    {
        public string Type { get; set; } = "Įrašas"; // Default to regular post
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AnimalType { get; set; }
        public DateTime? HuntedDate { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        // Club ID is passed in query parameter or from route
    }
}