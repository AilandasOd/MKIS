namespace MKInformacineSistemaBack.Auth.Models
{
    public class Roles
    {
        public const string Admin = nameof(Admin);
        public const string User = nameof(User);
        public const string Hunter = nameof(Hunter);

        public static readonly IReadOnlyCollection<string> All = new[] { Admin, User, Hunter };
    }
}
