"use client";

// Re-export specific components from the new structure
export {
  Skeleton,
  PageSkeleton,
  CardSkeleton,
  TextSkeleton,
  ButtonSkeleton,
  TableSkeleton,
} from "./skeletons";

export {
  AssessmentSkeleton,
  OptionsGridSkeleton,
  FairnessTestSkeleton,
} from "./skeletons/AssessmentSkeletons";

export { ReportSkeleton } from "./skeletons/ReportSkeleton";

export {
  AimaDataManagementSkeleton,
} from "./skeletons/AdminSkeletons";

export {
  ManageSubscriptionSkeleton,
  BillingHistorySkeleton,
} from "./skeletons/SubscriptionSkeleton";

export { SimplePageSkeleton } from "./skeletons/AuthSkeleton";
