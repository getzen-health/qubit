import SwiftUI
import AuthenticationServices

struct AuthView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.colorScheme) private var colorScheme

    @State private var isSigningIn = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo
            Image(systemName: "atom")
                .font(.system(size: 80))
                .foregroundStyle(.purple, .indigo.opacity(0.3))

            VStack(spacing: 8) {
                Text("Sign In")
                    .font(.largeTitle.bold())

                Text("Create an account to sync your health data across devices and access it on the web.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()

            // Error message
            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.horizontal)
            }

            // Sign in with Apple button
            SignInWithAppleButton(
                onRequest: configureAppleSignIn,
                onCompletion: handleAppleSignIn
            )
            .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
            .frame(height: 50)
            .cornerRadius(12)
            .padding(.horizontal, 24)
            .disabled(isSigningIn)

            // Skip button
            Button {
                // For development: skip auth
                appState.isAuthenticated = true
            } label: {
                Text("Skip for now")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 48)
        }
        .overlay {
            if isSigningIn {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)
            }
        }
    }

    private func configureAppleSignIn(_ request: ASAuthorizationAppleIDRequest) {
        request.requestedScopes = [.email, .fullName]
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                error = "Invalid credential type"
                return
            }

            isSigningIn = true
            error = nil

            Task {
                do {
                    try await SupabaseService.shared.signInWithApple(credential: credential)
                    await MainActor.run {
                        appState.isAuthenticated = true
                        isSigningIn = false
                    }
                } catch {
                    await MainActor.run {
                        self.error = error.localizedDescription
                        isSigningIn = false
                    }
                }
            }

        case .failure(let error):
            // User cancelled or other error
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                self.error = error.localizedDescription
            }
        }
    }
}

#Preview {
    AuthView()
        .environment(AppState())
}
