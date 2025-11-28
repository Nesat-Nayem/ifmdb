"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = require("../modules/auth/auth.routes");
const category_routes_1 = require("../modules/category/category.routes");
const banner_routes_1 = require("../modules/banner/banner.routes");
const contract_routes_1 = require("../modules/contact/contract.routes");
const savecard_routes_1 = require("../modules/savecard/savecard.routes");
const faq_routes_1 = require("../modules/faq/faq.routes");
const privacy_policy_routes_1 = require("../modules/privacy-policy/privacy-policy.routes");
const terms_condition_routes_1 = require("../modules/terms-condition/terms-condition.routes");
const help_support_routes_1 = require("../modules/help-support/help-support.routes");
const blog_routes_1 = require("../modules/blog/blog.routes");
const upload_routes_1 = require("../modules/upload/upload.routes");
const events_routes_1 = require("../modules/events/events.routes");
const event_category_routes_1 = require("../modules/event-category/event-category.routes");
const movies_routes_1 = require("../modules/movies/movies.routes");
const booking_routes_1 = require("../modules/booking/booking.routes");
const onboarding_routes_1 = require("../modules/onboarding/onboarding.routes");
const inquiry_routes_1 = require("../modules/inquiry/inquiry.routes");
const advertise_routes_1 = require("../modules/advertise/advertise.routes");
const help_center_routes_1 = require("../modules/help-center/help-center.routes");
const general_settings_routes_1 = require("../modules/general-settings/general-settings.routes");
const subscription_plan_routes_1 = require("../modules/subscription-plan/subscription-plan.routes");
const vendor_routes_1 = require("../modules/vendor/vendor.routes");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_routes_1.authRouter,
    },
    {
        path: "/categories",
        route: category_routes_1.categoryRouter,
    },
    {
        path: "/contracts",
        route: contract_routes_1.contractRouter,
    },
    {
        path: "/banners",
        route: banner_routes_1.bannerRouter,
    },
    {
        path: "/advertisements",
        route: advertise_routes_1.advertiseRouter,
    },
    {
        path: "/help-center",
        route: help_center_routes_1.helpCenterRouter,
    },
    {
        path: "/general-settings",
        route: general_settings_routes_1.generalSettingsRouter,
    },
    {
        path: "/onboarding",
        route: onboarding_routes_1.onboardingRouter,
    },
    {
        path: "/inquiries",
        route: inquiry_routes_1.inquiryRouter,
    },
    {
        path: "/save-cards",
        route: savecard_routes_1.saveCardRouter,
    },
    {
        path: "/faqs",
        route: faq_routes_1.faqRouter,
    },
    {
        path: "/privacy-policy",
        route: privacy_policy_routes_1.privacyPolicyRouter,
    },
    {
        path: "/terms-condition",
        route: terms_condition_routes_1.TermsConditionRouter,
    },
    {
        path: "/help-support",
        route: help_support_routes_1.helpSupportRouter,
    },
    {
        path: "/blogs",
        route: blog_routes_1.blogRouter,
    },
    {
        path: "/upload",
        route: upload_routes_1.uploadRouter,
    },
    {
        path: "/events",
        route: events_routes_1.eventRouter,
    },
    {
        path: "/event-categories",
        route: event_category_routes_1.eventCategoryRouter,
    },
    {
        path: "/movies",
        route: movies_routes_1.movieRouter,
    },
    {
        path: "/booking",
        route: booking_routes_1.bookingRouter,
    },
    {
        path: "/subscription-plans",
        route: subscription_plan_routes_1.subscriptionPlanRouter,
    },
    {
        path: "/vendors",
        route: vendor_routes_1.vendorRouter,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
