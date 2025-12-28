export default function DisclaimerPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Disclaimer &amp; Terms of Use</h1>
          <p className="text-muted-foreground text-lg">
            Please read these terms carefully before using our service
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          {/* Disclaimer Section */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              This service is powered by artificial intelligence. While it strives to provide helpful and accurate information, 
              AI can make mistakes. The responses generated are not legally binding and should not be considered professional, 
              medical, financial, or legal advice.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using this service, you acknowledge and agree that Legendary is 
              not responsible or liable for any decisions, actions, or outcomes based on the information provided. Use of the 
              service is at your own risk.
            </p>
          </section>

          {/* Privacy Policy */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of this service is subject to our Privacy Policy. Please review it to understand how we collect, 
              use, and protect your data.
            </p>
            <p>
              <a 
                href="https://legendary.com.my/pages/privacy-policy" 
                className="inline-flex items-center text-primary hover:underline font-medium"
              >
                Read our Privacy Policy →
              </a>
            </p>
          </section>

          {/* Terms of Service */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Terms of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              By continuing to use this service, you agree to our Terms of Service. These terms govern your use of the 
              service and outline your rights and responsibilities.
            </p>
            <p>
              <a 
                href="https://legendary.com.my/pages/terms-of-service" 
                className="inline-flex items-center text-primary hover:underline font-medium"
              >
                Read our Terms of Service →
              </a>
            </p>
          </section>

          {/* Consent */}
          <section className="space-y-3 p-6 rounded-lg bg-primary/5 border border-primary/20">
            <h2 className="text-2xl font-semibold text-foreground">Consent</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using this service, you consent to the disclaimers, limitations, and policies outlined above.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            If you have any questions, please{" "}
            <a href="https://legendary.com.my" className="text-primary hover:underline">
              contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
