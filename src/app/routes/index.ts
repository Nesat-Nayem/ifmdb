import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { categoryRouter } from "../modules/category/category.routes";
import { bannerRouter } from "../modules/banner/banner.routes";
import { contractRouter } from "../modules/contact/contract.routes";
import { saveCardRouter } from "../modules/savecard/savecard.routes";
import { faqRouter } from "../modules/faq/faq.routes";
import { privacyPolicyRouter } from "../modules/privacy-policy/privacy-policy.routes";
import { TermsConditionRouter } from "../modules/terms-condition/terms-condition.routes";
import { CancellationRefundRouter } from "../modules/cancellation-refund/cancellation-refund.routes";
import { PartnerTermsRouter } from "../modules/partner-terms/partner-terms.routes";
import { AboutUsRouter } from "../modules/about-us/about-us.routes";
import { ContactUsRouter } from "../modules/contact-us/contact-us.routes";
import { helpSupportRouter } from "../modules/help-support/help-support.routes";
import { blogRouter } from "../modules/blog/blog.routes";
import { uploadRouter } from "../modules/upload/upload.routes";
import { eventRouter } from "../modules/events/events.routes";
import { eventCategoryRouter } from "../modules/event-category/event-category.routes";
import { movieRouter } from "../modules/movies/movies.routes";
import { bookingRouter } from "../modules/booking/booking.routes";
import { onboardingRouter } from "../modules/onboarding/onboarding.routes";
import { inquiryRouter } from "../modules/inquiry/inquiry.routes";
import { advertiseRouter } from "../modules/advertise/advertise.routes";
import { helpCenterRouter } from "../modules/help-center/help-center.routes";
import { generalSettingsRouter } from "../modules/general-settings/general-settings.routes";
import { subscriptionPlanRouter } from "../modules/subscription-plan/subscription-plan.routes";
import { vendorRouter } from "../modules/vendor/vendor.routes";
import watchVideosRouter from "../modules/watch-videos/watch-videos.routes";
import { cloudflareStreamRouter } from "../modules/cloudflare-stream/cloudflare-stream.routes";
import walletRouter from "../modules/wallet/wallet.routes";
import notificationRouter from "../modules/notifications/notifications.routes";
import sectionSettingsRouter from "../modules/section-settings/section-settings.routes";
import ccavenuePaymentRouter from "../modules/payment/ccavenue-payment.routes";

const router = Router();
const moduleRoutes = [
  {
    path: "/auth",
    route: authRouter,
  },

  {
    path: "/categories",
    route: categoryRouter,
  },

  {
    path: "/contracts",
    route: contractRouter,
  },

  {
    path: "/banners",
    route: bannerRouter,
  },

  {
    path: "/advertisements",
    route: advertiseRouter,
  },

  {
    path: "/help-center",
    route: helpCenterRouter,
  },

  {
    path: "/general-settings",
    route: generalSettingsRouter,
  },

  {
    path: "/onboarding",
    route: onboardingRouter,
  },

  {
    path: "/inquiries",
    route: inquiryRouter,
  },

  {
    path: "/save-cards",
    route: saveCardRouter,
  },

  {
    path: "/faqs",
    route: faqRouter,
  },

  {
    path: "/privacy-policy",
    route: privacyPolicyRouter,
  },

  {
    path: "/terms-condition",
    route: TermsConditionRouter,
  },

  {
    path: "/cancellation-refund",
    route: CancellationRefundRouter,
  },

  {
    path: "/partner-terms",
    route: PartnerTermsRouter,
  },

  {
    path: "/about-us",
    route: AboutUsRouter,
  },

  {
    path: "/contact-us",
    route: ContactUsRouter,
  },

  {
    path: "/help-support",
    route: helpSupportRouter,
  },

  {
    path: "/blogs",
    route: blogRouter,
  },

  {
    path: "/upload",
    route: uploadRouter,
  },

  {
    path: "/events",
    route: eventRouter,
  },

  {
    path: "/event-categories",
    route: eventCategoryRouter,
  },

  {
    path: "/movies",
    route: movieRouter,
  },

  {
    path: "/booking",
    route: bookingRouter,
  },

  {
    path: "/subscription-plans",
    route: subscriptionPlanRouter,
  },
  {
    path: "/vendors",
    route: vendorRouter,
  },
  {
    path: "/watch-videos",
    route: watchVideosRouter,
  },
  {
    path: "/cloudflare-stream",
    route: cloudflareStreamRouter,
  },
  {
    path: "/wallet",
    route: walletRouter,
  },
  {
    path: "/notifications",
    route: notificationRouter,
  },
  {
    path: "/section-settings",
    route: sectionSettingsRouter,
  },
  {
    path: "/payment/ccavenue",
    route: ccavenuePaymentRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
