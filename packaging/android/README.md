# VexaTrade Ecosystem Android packaging

Canonical native Android packaging for the Ecosystem User and Admin web applications.

Variants: `user` (`com.mytele.vexatrade.ecosystem.user`) and `admin` (`com.mytele.vexatrade.ecosystem.admin`).

Override deployment URLs with `-PuserWebAppUrl=...` and `-PadminWebAppUrl=...` when deployment hostnames change.

Build with `./gradlew assembleUserRelease bundleUserRelease assembleAdminRelease bundleAdminRelease`. GitHub Actions builds both APK and AAB variants on every `main` push and manual run. The project targets Android API 36 and uses JDK 17 in CI.

No signing keys are committed. Configure the production signing key in the release pipeline before store publication.
