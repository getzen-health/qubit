import Foundation

struct User: Codable, Identifiable {
    let id: UUID
    var email: String?
    var displayName: String?
    var avatarUrl: String?
    var timezone: String
    var createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
        case timezone
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
