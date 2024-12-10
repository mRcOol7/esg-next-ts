import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
    title: "Sign Up | ESG",
    description: "Sign Up",
    openGraph: {
        title: "Sign Up | ESG",
        description: "Sign Up",
    },
    twitter: {
        title: "Sign Up | ESG",
        description: "Sign Up",
    },
};

const SignupLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <NextTopLoader color="#4ade80" height={3} showSpinner={false} />
            {children}
        </>
    );
};

export default SignupLayout;