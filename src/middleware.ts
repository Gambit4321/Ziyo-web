import { withAuth } from "next-auth/middleware"

export default withAuth(
    function middleware(req) {
        // Custom logic if needed
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                // Only allow admin to access protected routes
                return token?.role === "admin";
            },
        },
    }
)

export const config = { matcher: ["/admin/dashboard/:path*", "/admin/posts/:path*", "/admin/settings/:path*"] }
