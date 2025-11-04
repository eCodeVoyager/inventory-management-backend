# Inventory Management System - Course Project Requirements

## Table of Contents

1. [Technology Stack Requirements](#technology-stack-requirements)
2. [Project Overview](#project-overview)
3. [Authentication & Authorization](#authentication--authorization)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Core Features](#core-features)
6. [Killer Feature #1: Custom Inventory IDs](#killer-feature-1-custom-inventory-ids)
7. [Killer Feature #2: Custom Fields](#killer-feature-2-custom-fields)
8. [User Interface Requirements](#user-interface-requirements)
9. [Main Page Content](#main-page-content)
10. [Additional Features](#additional-features)
11. [Technical Requirements](#technical-requirements)
12. [Prohibited Practices](#prohibited-practices)
13. [Optional Requirements (Bonus)](#optional-requirements-bonus)
14. [Important Notes](#important-notes)

---

## Technology Stack Requirements

### Choose Your Stack:

#### **Option 1: .NET Group**

- **Language**: C# (required)
- **Framework**: Blazor OR MVC (your choice)
- **Additional**: JavaScript or TypeScript as needed

#### **Option 2: JavaScript Group**

- **Language**: JavaScript OR TypeScript (your choice)
- **Frontend**: React (required)
- **Backend**: Express (or other framework of your choice)

### Common Requirements:

- **CSS Framework**: Bootstrap (recommended) or any other CSS framework
- **Database**: Any database (PostgreSQL, MySQL, SQL Server recommended; MongoDB allowed but not recommended)
- **ORM**: **REQUIRED** (e.g., Sequelize, Prisma, TypeORM, Entity Framework)
- **Additional Libraries**: Allowed and encouraged (use ready-made components)
- **Architecture**: No limitations - choose your approach

---

## Project Overview

Build a **Web application for inventory management** that allows users to:

- Define arbitrary "inventories" (templates with custom fields)
- Fill inventories with "items" using these templates
- Manage custom inventory numbers (IDs)
- Define custom fields for items

**Example**: Create an inventory with fields "Model" (string) and "Price" (number). Other users add their laptops to this inventory.

**Key Principle**: This is a **general-purpose inventory management system**, not a specific app for libraries, stores, or warehouses. Users create arbitrary inventories for any purpose.

---

## Authentication & Authorization

### Authentication Methods:

- **Social Network Login** (required): At least 2 providers
  - Google and Facebook are excellent options
  - Users can register and authenticate via social networks

### Non-Authenticated Users:

- ✅ Can use full-text search
- ✅ Can view all inventories and items (read-only)
- ❌ Cannot create inventories
- ❌ Cannot add items
- ❌ Cannot leave comments or likes

### Authenticated Users:

- All non-authenticated capabilities
- Can create inventories
- Can add items (if they have write access)
- Can leave comments and likes

---

## User Roles & Permissions

### Regular Users:

- Own their inventories
- Can grant write access to specific users or make inventory public
- Can edit only their own inventories

### Inventory Creator (Owner):

- Full control over their inventories
- Can add/edit/delete fields
- Can manage access settings
- Can mark inventory as public or restrict to specific users
- Can view all tabs on inventory page

### Users with Write Access:

- Can add, edit, and delete items in the inventory
- Can access discussion section
- **Cannot** modify inventory settings or fields
- Only see items tab and discussion tab in edit mode

### Admins:

- **Full access to everything**
- Can view all pages as if they were the creator
- Can edit any inventory (act as owner of every inventory)
- Can manage users: view, block, unblock, delete
- Can add/remove admin role from users
- **IMPORTANT**: An admin can remove admin access from themselves

---

## Core Features

### Personal User Page

Every user has a personal page with **two sortable/filterable tables**:

1. **Owned Inventories Table**

   - Inventories the user created
   - Options: create new, delete, edit

2. **Write Access Inventories Table**
   - Inventories where user has write access
   - Can add/edit/delete items

Each inventory in tables is a **link** to its dedicated inventory page.

---

### Inventory Page Structure

Each inventory has a dedicated page with **multiple tabs**:

#### **Tab 1: Items Table**

- Display all items in the inventory
- Each item is a link to individual item page
- Users with write access can:
  - Click any item to open in edit mode
  - Delete existing items
  - Add new items
- Users without write access: **read-only**

#### **Tab 2: Discussion Section**

- Linear posts (new posts always at the end)
- **Real-time updates**: New posts appear within 2-5 seconds for all users
- Each post displays:
  - Markdown text
  - User name (link to user's personal page)
  - Date/time

#### **Tab 3: General Settings** (Owner/Admin only)

- Title
- Description (supports **Markdown formatting**)
- Category (single selection from predefined list):
  - Equipment
  - Furniture
  - Book
  - Other
  - _(New categories added directly in database - no UI needed)_
- Optional image/illustration (uploaded to **cloud**)
- Tags:
  - Multiple tags supported
  - **Autocomplete required**: Dropdown with existing tags that start with entered text

#### **Tab 4: Custom Inventory Numbers** (Owner/Admin only)

- Configure custom ID format for items
- See [Killer Feature #1](#killer-feature-1-custom-inventory-ids)

#### **Tab 5: Access Settings** (Owner/Admin only)

- **Public Mode**: All authenticated users have write access
- **Private Mode**: Select specific users
  - Add users by typing username or email
  - **Autocomplete required** (by name and email)
  - Remove users from list
  - Sortable list (by name or by email)

#### **Tab 6: Custom Fields** (Owner/Admin only)

- Define and manage custom fields for items
- See [Killer Feature #2](#killer-feature-2-custom-fields)

#### **Tab 7: Statistics/Aggregation** (View only)

- Number of items
- Averages and ranges for numeric fields
- Most frequently used values for string fields
- **No editing on this tab**

---

### Auto-Save Feature

**Inventory page** supports auto-save (not required for items):

- Don't save every keystroke
- Track changes and save every **7-10 seconds**
- **Beware of optimistic locking**:
  - Each save updates version in database
  - Returns new version for next save
  - Operation fails if conflict detected

---

## Killer Feature #1: Custom Inventory IDs

### Overview

Each inventory can define its own **custom ID format** that generates unique IDs specific to that inventory.

### Key Points:

- **Internal ID**: Globally unique, not displayed in UI
- **Custom ID**: Unique within single inventory
  - Items in different inventories may have same custom ID
  - Uniqueness enforced at **database level**
  - Managed by composite database index (inventory_id + custom_id)
- **Custom IDs are editable**: Single string input field with format validation
- **Not a primary key**: Separate from global unique ID
- Generated by system when item is created
- If format changes later, existing IDs remain unchanged
- During item editing, new format rules are enforced

### Supported ID Elements:

1. **Fixed text** (full Unicode support)
2. **20-bit random number**
3. **32-bit random number**
4. **6-digit random number**
5. **9-digit random number**
6. **GUID**
7. **Date/time** (at moment of item creation)
8. **Sequence** (largest existing sequence number + 1)

### User Actions:

- **Reorder elements**: Drag-and-drop
- **Remove elements**: Drag outside form
- **Add new elements**: At least 10 elements supported
- **Change formatting**: e.g., numbers with leading zeros

### UI Requirements:

- **Real-time preview** of resulting ID on Custom ID tab
- **Detailed help** using popovers for formatting options
- **Conflict handling**: If duplicate ID generated, database rejects item
  - User must manually edit custom ID value

---

## Killer Feature #2: Custom Fields

### Fixed Fields (Always Present)

These are **not visible in field customization UI** but displayed on every item form:

- `created_by`
- `created_at`
- `custom_id` (editable despite automatic generation)

### Custom Field Limitations:

| Field Type            | Maximum Count |
| --------------------- | ------------- |
| Single-line text      | Up to 3       |
| Multi-line text       | Up to 3       |
| Numeric               | Up to 3       |
| Document/image (link) | Up to 3       |
| True/false (checkbox) | Up to 3       |

### Each Custom Field Includes:

- **Title**
- **Description** (displayed as tooltip/hint)
- **Display flag**: Whether field appears in item table view

### Field Management:

- **Reorder**: Drag-and-drop functionality
- Fields can be added/removed by inventory owner

### Example: Library Books Inventory

```
- Single-line field: "Title"
- Single-line field: "Authors"
- Numeric field: "Year"
- Multi-line field: "Annotation"
```

### Important Data Storage Notes:

> ⚠️ **DO NOT** use JSON to serialize items for storage
>
> - You need to edit inventories and preserve fields
> - Field titles can change
> - Fields can be removed
> - Items should remain compatible
> - Need to calculate aggregate values

> ⚠️ **DO NOT** generate tables in database on the fly
>
> - Use fixed schema with up to 3 fields of each type
> - Manage which fields are shown and their titles
> - Relational database fits this task perfectly

---

## User Interface Requirements

### UI/UX Rules:

#### **FORBIDDEN**: Buttons in Table Rows (-20% grade penalty)

```
❌ WRONG:
┌─────────┬─────────────────┬────────────────┐
│ ID      │ Equipment       │                │
├─────────┼─────────────────┼────────────────┤
│ XD_6332 │ Personal laptop │ [Edit][Delete] │
├─────────┼─────────────────┼────────────────┤
│ XN_23FA │ Fax machine     │ [Edit][Delete] │
└─────────┴─────────────────┴────────────────┘
```

#### **CORRECT**: Toolbars or Animated Context Actions

```
✅ CORRECT:
[Delete]

 ⍰  ID        Equipment             Year
─────────────────────────────────────────────
 ☐  XD_6332   Personal laptop      2025
 ☑  XN_23FA   Fax machine          2023
 ☐  YN_544C   Workstation          2027
```

### Display Requirements:

- **Table representation required** for items and inventories
- No gallery or tiles as default view
- May add other display options, but **do not replace tables**

### Search Functionality:

- **Full-text search** available via top header on every page
- Accessible to all users (including non-authenticated)
- Search functionality **required**

### Localization:

- **Two UI languages**: English + one additional language
  - Examples: Polish, Spanish, Uzbek, Georgian
- User selects language, choice is saved
- **Only UI is translated** - user content not translated

### Themes:

- **Two visual themes**: Light and Dark
- User selects theme, choice is saved

### Responsive Design:

- Support various screen sizes and resolutions
- **Mobile phone support required**

---

## Main Page Content

The main page displays:

### 1. Latest Inventories Table

- Shows: name, description (or image), creator
- Recent inventories created

### 2. Top 5 Popular Inventories

- Based on number of items
- Displayed in table format

### 3. Tag Cloud

- Clicking a tag displays related inventories
- **Reuse standard "search results" page layout** for tag results

---

## Additional Features

### Item Likes:

- Each item has "like" feature
- **One like per user per item** (no more than one)
- Like counter displayed

### Optimistic Locking:

Required for:

- **Inventories**: Modified simultaneously by creator and admins
- **Items**: Modified by multiple users with write access

### Page Navigation:

Must include:

- Site navigation
- Account features (login/logout)
- Language selection
- Theme switching
- Search functionality

---

## Technical Requirements

### Must Use:

- ✅ **CSS Framework** (Bootstrap or alternative)
- ✅ **Responsive Design**
- ✅ **ORM** (Sequelize, Prisma, TypeORM, Entity Framework, etc.)
- ✅ **Full-text search engine** (external library or native database features)
- ✅ **Cloud storage** for images (not web server or database)
- ✅ **Ready-made components and libraries**
  - Markdown renderer
  - Image uploader with drag-and-drop
  - Tag input control
  - Tag cloud renderer
  - Use libraries as much as possible

### Performance:

- Avoid full database scans with raw `SELECT *`
- No database queries inside loops
- Efficient query optimization

---

## Prohibited Practices

### ❌ DON'Ts:

1. **No buttons in table rows** (-20% penalty)
2. **No image uploads to web server or database**
   - Use cloud storage instead
3. **No full database scans**
   - Use `SELECT *` appropriately
4. **No queries inside loops**
   - Optimize with proper queries
5. **No JSON serialization for item storage**
   - Use proper relational database structure
6. **No dynamic table generation in database**
   - Use fixed schema with flexible display
7. **No copying code** from dumps or old repositories
   - Requirements have small detail changes
   - Must understand every line you write
   - Will be asked to modify code on the fly
   - Technical questions during defense

---

## Optional Requirements (Bonus)

_Only implement if all core requirements are fully complete_

1. **Document Previews**

   - Display previews for document/image links
   - Support JPG and PDF

2. **Form Authentication**

   - Email confirmation as alternative to social login

3. **Field Tuning Options**

   - String fields: length limits, regex validators
   - Numeric fields: value ranges

4. **"One from List" Field Type**

   - Define custom dropdown options
   - Example: "Type" field with "Desktop"/"Laptop"/"Tablet"

5. **Unlimited Custom Fields**

   - Remove 0-3 limitation
   - Allow arbitrary number of fields of any type

6. **Inventory Export**
   - Export to CSV/Excel

---

## Important Notes

### Deployment Strategy:

> **Start by deploying a static "Hello, world" page**
>
> - Always keep a deployable version ready
> - Deploy early, deploy often

### Defense Strategy:

> **Defend your project even if only partially complete**
>
> - Better to present incomplete project than nothing
> - Understand every line of code you write
> - Be ready to modify code on the fly
> - Be ready to answer technical questions

### Code Quality Over Quantity:

> _"Do less, but better"_ - Marcus Aurelius
>
> - Better to implement fewer features well
> - Full understanding is more important than feature count
> - Quality matters more than quantity

### Motivation:

> Fight to the end - even incomplete project is valuable
>
> - Every line of code is investment in your future
> - Completing project (even partially) creates good habits
> - Dropping projects creates bad habits

### Future Considerations:

> ⚠️ **Additional requirements will be added later**
>
> - Up to 3 integrations with 3rd-party applications/services
> - This simulates real-life development
> - **DO NOT** implement "store" or "blog" - follow exact requirements

### Benefits of Completion:

For those who defend their project (even if incomplete >25%):

- Certificate of completion
- List of additional tasks for self-education
- Results stored for future offers ("waiting list")
- Technical advice for next month's tasks

### Use of Libraries:

> **The less custom code, the better**
>
> - Use ready-made components extensively
> - Use libraries for common functionality
> - Focus on integration, not reinventing the wheel

### Supervisor Awareness:

> Your supervisor has seen many similar projects
>
> - Familiar with most publicly available examples
> - **DO NOT COPY CODE**
> - Use libraries, but don't copy-paste code

---

## Quick Reference Checklist

### Authentication:

- [ ] Social login (2+ providers)
- [ ] User registration
- [ ] Non-authenticated read-only access

### User Roles:

- [ ] Regular users
- [ ] Inventory creators/owners
- [ ] Users with write access
- [ ] Admin role with full access
- [ ] Admin can remove own admin access

### Inventory Management:

- [ ] Create/edit/delete inventories
- [ ] Public vs private inventories
- [ ] User access management with autocomplete
- [ ] 7 tabs on inventory page
- [ ] Auto-save (7-10 seconds)
- [ ] Optimistic locking

### Custom IDs:

- [ ] 8 types of ID elements supported
- [ ] Drag-and-drop reordering
- [ ] Real-time preview
- [ ] Database-level uniqueness
- [ ] Editable IDs with validation

### Custom Fields:

- [ ] Up to 3 of each type (5 types)
- [ ] Fixed fields always present
- [ ] Field titles, descriptions, display flags
- [ ] Drag-and-drop reordering
- [ ] Proper relational database structure

### Items:

- [ ] Add/edit/delete by users with access
- [ ] Like feature (one per user)
- [ ] View mode for all users
- [ ] Optimistic locking

### UI Requirements:

- [ ] No buttons in table rows
- [ ] Table display for inventories and items
- [ ] Full-text search on every page
- [ ] 2 languages
- [ ] 2 themes (light/dark)
- [ ] Responsive design
- [ ] Mobile support

### Main Page:

- [ ] Latest inventories table
- [ ] Top 5 popular inventories
- [ ] Tag cloud

### Additional Features:

- [ ] Discussion section with real-time updates
- [ ] Statistics/aggregation tab
- [ ] Markdown support
- [ ] Cloud image storage
- [ ] Tag autocomplete

### Technical:

- [ ] ORM usage
- [ ] Full-text search
- [ ] CSS framework
- [ ] No prohibited practices
- [ ] Deployed and working

---

## Project Defense Preparation

### Be Ready to:

1. **Modify code on the fly**

   - Add new functionality
   - Change existing features
   - Fix bugs in real-time

2. **Answer technical questions**

   - Explain why every line is written
   - Describe architecture decisions
   - Discuss technology choices

3. **Navigate your codebase**
   - Show understanding of structure
   - Explain component interactions
   - Demonstrate knowledge of libraries used

### Remember:

> Understanding > Features
>
> - Better to implement less but understand everything
> - Code modifications during defense are expected
> - Technical knowledge will be tested
> - Project completion creates positive habits

---

## Resources & Support

### For Questions:

- Check pinned messages in course channels
- Review rants channel for important updates
- Ask supervisor for clarification (not solutions)

### Documentation:

- Use official documentation for libraries
- Follow best practices for chosen stack
- Leverage community resources appropriately

### Getting Help:

- Supervisors can advise on approach
- Will not solve problems for you
- Can recommend what to read or study
- Available for technical guidance

---

**Good luck with your project! Start early, deploy often, and defend your work!**

---

_Last Updated: Based on course materials through October 11, 2025_
