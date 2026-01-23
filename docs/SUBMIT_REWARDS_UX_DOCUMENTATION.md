# Submit Rewards Flow - Complete UX Documentation

> **Document Purpose**: Comprehensive documentation of the Crescendo Submit Rewards flow for external UX review and optimization.
>
> **Last Updated**: January 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Journey Map](#2-user-journey-map)
3. [Screen-by-Screen Breakdown](#3-screen-by-screen-breakdown)
4. [Form Fields Reference](#4-form-fields-reference)
5. [Data Model](#5-data-model)
6. [Conditional Logic](#6-conditional-logic)
7. [Error States & Validation](#7-error-states--validation)
8. [Admin Review Flow](#8-admin-review-flow)
9. [Known Pain Points](#9-known-pain-points)
10. [Technical Notes](#10-technical-notes)

---

## 1. Overview

### What is the Submit Rewards Feature?

The Submit Rewards feature allows Crescendo community members to propose new rewards for the marketplace. Users can suggest physical products, digital goods, gift cards, experiences, NFTs, merchandise, subscriptions, or other reward types.

### Key User Personas

| Persona | Description | Goals |
|---------|-------------|-------|
| **Contributor** | Logged-in member submitting rewards | Earn NCTR tokens by contributing approved rewards |
| **Admin/Moderator** | Staff reviewing submissions | Approve, edit, reject, or request changes on submissions |

### Success Metrics (Current)

- Submission completion rate
- Approval rate
- Time from submission to approval
- Contributor earnings from approved rewards

---

## 2. User Journey Map

### Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUBMIT REWARDS USER JOURNEY                         │
└─────────────────────────────────────────────────────────────────────────────┘

ENTRY POINTS:
├── Dashboard → "Submit Reward" sidebar link
├── Sidebar Navigation → "Submit Reward" menu item
└── Direct URL → /submit-reward

                              ▼

┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: CLAIM PASS CONVERSION RATE SELECTION                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ User selects how they want to be rewarded:                                   │
│ • 360LOCK Rate: 1 Claim Pass = 200 NCTR (locked 360 days) ← DEFAULT          │
│ • 90LOCK Rate:  1 Claim Pass = 75 NCTR (locked 90 days)                      │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: REWARD TYPE SELECTION                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ User clicks one of 8 reward type cards:                                      │
│ • Physical Product    • Experience      • Merchandise                        │
│ • Digital Good        • NFT/Crypto      • Subscription                       │
│ • Gift Card           • Other                                                │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: REWARD DETAILS                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ User fills in:                                                               │
│ • Reward Title (required, max 100 chars)                                     │
│ • Description (required, max 500 chars)                                      │
│ • Category dropdown (required)                                               │
│ • Brand/Partner (optional)                                                   │
│ • Reward Image upload (optional, 5MB max)                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: EXCHANGE RATE & SUPPLY                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ User configures:                                                             │
│ • Suggested NCTR Cost (required, number)                                     │
│ • Claim Passes Required (dropdown: 1, 2, 3, or 5)                            │
│ • Recommended Lock Period (dropdown: 30/90/180/365 days)                     │
│ • Stock Quantity (optional, for limited items)                               │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: REVIEW & SUBMIT                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ • Progress indicator shows completion status (sidebar)                       │
│ • Submit button enabled when required fields ≥80% complete                   │
│ • User clicks "Submit Rewards" button                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: CONFIRMATION DIALOG                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Modal appears with:                                                          │
│ • "Are you sure you want to submit this reward?"                             │
│ • Summary of what happens next                                               │
│ • "Cancel" and "Confirm Submit" buttons                                      │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: SUCCESS STATE                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ • Toast notification: "Reward submitted successfully!"                       │
│ • Form resets to initial state                                               │
│ • User can view submission at /my-submissions                                │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ POST-SUBMISSION: MY SUBMISSIONS PAGE                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ User can:                                                                    │
│ • View all their submissions                                                 │
│ • Filter by status (Pending/Approved/Rejected)                               │
│ • See admin notes on reviewed submissions                                    │
│ • Update/version existing submissions                                        │
│ • Share approved rewards to earn bonuses                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Screen-by-Screen Breakdown

### Screen 1: Main Submit Rewards Page (`/submit-reward`)

**Layout**: Two-column layout on desktop, single column on mobile

#### Left Column (Main Form)

| Section | Components |
|---------|------------|
| **Header** | Back button, page title "Opportunity & Rewards Marketplace", "Earn contributor rewards" badge |
| **Claim Pass Conversion** | Two large selectable cards for 360LOCK vs 90LOCK rates |
| **How It Works** | 3-step visual explainer |
| **Reward Type** | 8 clickable type cards in 2x4 grid |
| **Reward Details** | Title, Description, Category, Brand, Image upload |
| **Exchange Rate & Supply** | NCTR cost, Claim passes, Lock period, Stock quantity |
| **Action Buttons** | Cancel, Submit Rewards |

#### Right Column (Sidebar)

| Section | Description |
|---------|-------------|
| **Claims Calculator** | Interactive calculator showing NCTR earnings based on lock rate |
| **Progress Tracker** | Checklist of form completion steps with checkmarks |
| **Quality Tips** | 4 bullet points of submission guidelines |
| **Contributor Protection** | Trust badge explaining contributor rights |

### Screen 2: Confirmation Dialog

**Type**: Modal overlay

| Element | Content |
|---------|---------|
| Title | "Confirm Submission" |
| Body | Reminder about review process |
| Actions | Cancel (secondary), Confirm Submit (primary) |

### Screen 3: My Submissions Page (`/my-submissions`)

**Layout**: Full-width list view

| Section | Description |
|---------|-------------|
| **Stats Cards** | Total Submissions, Pending, Approved, Rejected counts |
| **Filter Dropdown** | All / Pending / Approved / Rejected |
| **Submission Cards** | Image, title, status badge, details grid, actions |

---

## 4. Form Fields Reference

### Required Fields

| Field Name | Type | Validation | Max Length | Default | UI Element |
|------------|------|------------|------------|---------|------------|
| `reward_type` | text | Required, must be one of 8 options | - | None | Clickable cards (2x4 grid) |
| `title` | text | Required, non-empty | 100 chars | "" | Text input with character counter |
| `description` | text | Required, non-empty | 500 chars | "" | Textarea with character counter |
| `category` | text | Required, must select | - | None | Dropdown select |
| `nctr_value` | integer | Required, min: 1 | - | None | Number input |

### Optional Fields

| Field Name | Type | Validation | Max Length | Default | UI Element |
|------------|------|------------|------------|---------|------------|
| `brand` | text | None | - | null | Text input |
| `image_url` | text | Valid image file (JPG/PNG/GIF/WebP), max 5MB | - | null | File upload with preview |
| `stock_quantity` | integer | min: 1 if provided | - | null (unlimited) | Number input |

### Pre-configured Fields

| Field Name | Type | Options | Default | UI Element |
|------------|------|---------|---------|------------|
| `lock_rate` | text | "360" or "90" | "360" | Two large toggle cards |
| `claim_passes_required` | integer | 1, 2, 3, 5 | 1 | Dropdown select |
| `lockPeriod` | text | "30", "90", "180", "365" | "30" | Dropdown select |

### Dropdown Options Detail

#### Reward Types
| ID | Label | Icon |
|----|-------|------|
| `physical` | Physical Product | Package |
| `digital` | Digital Good | Zap |
| `giftcard` | Gift Card | CreditCard |
| `experience` | Experience | Ticket |
| `nft` | NFT/Crypto | Sparkles |
| `merch` | Merchandise | Shirt |
| `subscription` | Subscription | Star |
| `other` | Other | Gift |

#### Categories
| Value | Label |
|-------|-------|
| `tech` | Technology |
| `fashion` | Fashion |
| `entertainment` | Entertainment |
| `travel` | Travel |
| `food` | Food & Dining |
| `wellness` | Wellness |
| `opportunity` | Opportunity |
| `other` | Other |

#### Claim Passes Required
| Value | Label |
|-------|-------|
| `1` | 1 Pass |
| `2` | 2 Passes |
| `3` | 3 Passes |
| `5` | 5 Passes |

#### Lock Periods
| Value | Label | Multiplier |
|-------|-------|------------|
| `30` | 30 days | 1x |
| `90` | 90 days | 1.5x |
| `180` | 180 days | 2x |
| `365` | 365 days | 3x |

---

## 5. Data Model

### Database Table: `reward_submissions`

```sql
CREATE TABLE reward_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id),
  lock_rate             TEXT NOT NULL,           -- "360" or "90"
  reward_type           TEXT NOT NULL,           -- physical, digital, etc.
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  category              TEXT NOT NULL,
  brand                 TEXT,                    -- nullable
  nctr_value            INTEGER NOT NULL,
  claim_passes_required INTEGER NOT NULL DEFAULT 1,
  stock_quantity        INTEGER,                 -- nullable = unlimited
  image_url             TEXT,                    -- nullable
  status                TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  admin_notes           TEXT,                    -- nullable
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  version               INTEGER NOT NULL DEFAULT 1,
  parent_submission_id  UUID REFERENCES reward_submissions(id),
  is_latest_version     BOOLEAN NOT NULL DEFAULT true,
  version_notes         TEXT                     -- nullable
);
```

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Awaiting admin review |
| `approved` | Approved and added to marketplace |
| `rejected` | Rejected by admin |

### Data Flow

```
User Submission
      │
      ▼
┌─────────────────┐
│ reward_submissions │
│   status: pending  │
└─────────────────┘
      │
      ▼ (Admin approves)
      │
┌─────────────────┐
│    rewards      │  ← New reward created automatically via trigger
│  (marketplace)  │
└─────────────────┘
```

---

## 6. Conditional Logic

### Form Behavior

| Condition | Effect |
|-----------|--------|
| No reward type selected | Submit button appears but form validation fails |
| Image selected | Preview thumbnail appears with remove button |
| Image > 5MB | Error toast, file rejected |
| Invalid image type | Error toast, file rejected |
| Required fields < 80% complete | Submit button disabled |
| Lock rate = 360 | Calculator shows 200 NCTR per claim pass |
| Lock rate = 90 | Calculator shows 75 NCTR per claim pass |
| Image uploaded | Image compression runs automatically before upload |

### User State Conditions

| Condition | Effect |
|-----------|--------|
| User not logged in | Error toast "You must be logged in to submit rewards" |
| No unified profile | Submission fails |

### Post-Submission Conditions

| Submission Status | User Actions Available |
|-------------------|----------------------|
| Pending | View, Update (creates new version) |
| Approved | View, Share, View share analytics |
| Rejected | View, Update (resubmit with changes), View admin notes |

---

## 7. Error States & Validation

### Client-Side Validation Errors

| Trigger | Error Message | Display Method |
|---------|---------------|----------------|
| Submit with missing required fields | "Please fill in all required fields" | Toast (error) |
| Submit while not logged in | "You must be logged in to submit rewards" | Toast (error) |
| Image file > 5MB | "File is too large. Maximum size is 5MB" | Toast (error) |
| Invalid image format | "Invalid file type. Allowed: JPG, PNG, GIF, WebP" | Toast (error) |

### Server-Side Errors

| Trigger | Error Message | Display Method |
|---------|---------------|----------------|
| Database insert fails | "Failed to submit reward. Please try again." | Toast (error) |
| Image upload fails | "Failed to upload image" | Toast (error) |

### Success Messages

| Trigger | Message | Display Method |
|---------|---------|----------------|
| Submission successful | "Reward submitted successfully! Our team will review it soon." | Toast (success) |
| Image compressed | "Image compressed: {old} → {new} ({%} reduction)" | Toast (success) |

---

## 8. Admin Review Flow

### Admin Panel: Submissions Tab (`/admin` → Submissions)

**Layout**: Split-panel view (list on left, detail on right)

#### Left Panel - Submissions List

| Element | Description |
|---------|-------------|
| **Status Tabs** | All / Pending (with count badge) / Approved / Rejected |
| **Search** | Search by title or submitter email |
| **Category Filter** | Dropdown to filter by category |
| **Submission Cards** | Thumbnail, title, status, submitter, date |

#### Right Panel - Selected Submission Detail

| Section | Content |
|---------|---------|
| **Header** | Large image, title, status badge, version info |
| **Submitter Info** | User name, email, submission date |
| **Reward Details** | Type, Category, Brand, NCTR value, Claim passes, Lock rate |
| **Description** | Full description text |
| **Admin Actions** | Approve & Edit, Request Changes, Reject buttons |

### Admin Action Flows

#### Approve & Edit Flow
1. Admin clicks "Approve & Edit"
2. Modal opens with editable fields:
   - Title
   - Description
   - Cost (claim passes)
   - Category
   - Stock quantity
   - Featured toggle
3. Admin makes changes and clicks "Approve with Edits"
4. Submission status → approved
5. New reward automatically created in `rewards` table

#### Request Changes Flow
1. Admin clicks "Request Changes"
2. Modal opens with message textarea
3. Admin writes specific change requests
4. Status remains `pending` with admin_notes updated
5. User sees message on My Submissions page

#### Reject Flow
1. Admin clicks "Reject"
2. Modal opens with:
   - Rejection reason dropdown
   - Custom message textarea
3. Admin selects reason and optionally adds details
4. Submission status → rejected

#### Rejection Reasons

| Value | Label |
|-------|-------|
| `duplicate` | Duplicate reward |
| `inappropriate` | Inappropriate content |
| `insufficient` | Insufficient details |
| `not_aligned` | Not aligned with Crescendo |
| `other` | Other |

---

## 9. Known Pain Points

### User Experience Issues

| Issue | Description | Impact | Priority |
|-------|-------------|--------|----------|
| **No draft saving** | Form resets if user navigates away | Users lose work, abandon submissions | High |
| **Lock rate confusion** | 360LOCK vs 90LOCK terminology is unclear | Users may not understand the tradeoff | High |
| **NCTR value guidance lacking** | No help for pricing recommendations | Users submit unrealistic values | Medium |
| **No preview mode** | Users can't see how their reward will appear in marketplace | Quality concerns | Medium |
| **Category mismatch** | Submit form categories don't match admin filter categories exactly | Filtering inconsistency | Low |
| **Progress indicator inaccurate** | Shows brand as required for progress but it's optional | Confusing progress feedback | Low |

### Technical Debt

| Issue | Description |
|-------|-------------|
| **Image compression UX** | No loading indicator during compression |
| **No autosave** | Single page form with no persistence |
| **Version history UX** | Available but not prominently surfaced |

### Admin Pain Points

| Issue | Description |
|-------|-------------|
| **Bulk actions missing** | Cannot approve/reject multiple submissions at once |
| **No notification to user** | Users must check manually for status updates |
| **Featured toggle timing** | Must wait for trigger before toggling featured |

---

## 10. Technical Notes

### File Locations

| Component | Path |
|-----------|------|
| Submit Form | `src/components/SubmitRewardsPage.tsx` |
| My Submissions | `src/components/MySubmissionsPage.tsx` |
| Admin Submissions | `src/components/admin/AdminSubmissions.tsx` |
| Update Modal | `src/components/UpdateRewardModal.tsx` |
| Version History | `src/components/RewardVersionHistory.tsx` |
| Image Validation | `src/lib/image-validation.ts` |
| Image Compression | `src/lib/image-compression.ts` |
| Calculator Component | `src/components/rewards/ClaimsToNCTRCalculator.tsx` |

### Image Upload Specifications

| Spec | Value |
|------|-------|
| Max file size | 5MB (1MB recommended) |
| Recommended dimensions | 800×600px (4:3 aspect ratio) |
| Allowed formats | JPG, PNG, GIF, WebP |
| Storage bucket | `reward-images` (Supabase Storage) |
| Compression | Automatic, shows stats if >10% reduction |

### Database Triggers

- On approval, a trigger creates a corresponding entry in the `rewards` table
- The `admin_notes` field stores the created reward ID for reference

---

## Appendix: Screenshots Reference

> **Note**: Screenshots cannot be captured for auth-protected pages. Below are descriptions of each screen state.

### Screen States to Capture

1. **Empty form state** - Initial page load
2. **Partially completed form** - Mid-progress with some fields filled
3. **Lock rate selection** - 360LOCK selected vs 90LOCK selected
4. **Reward type selection** - One type highlighted
5. **Image preview state** - After uploading an image
6. **Progress sidebar** - Showing completion checkmarks
7. **Confirmation modal** - Pre-submit dialog
8. **Success toast** - After successful submission
9. **My Submissions - Empty** - No submissions yet
10. **My Submissions - With items** - Mixed status submissions
11. **Admin panel - Pending queue** - List of pending submissions
12. **Admin panel - Detail view** - Selected submission expanded
13. **Admin - Approve modal** - Edit before approval
14. **Admin - Reject modal** - Rejection reason selection

---

*End of Documentation*
