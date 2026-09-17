# MediRipple

### Healthcare Supply-Chain Early Warning & Cascade Intelligence

MediRipple is a web-based healthcare supply-chain intelligence platform for monitoring medicine inventory, identifying facility-level stockout risks, analyzing referral-network spillovers, simulating shortage cascades, and generating redistribution and procurement recommendations.

---

## Table of Contents

| Section                                                      | Description                                    |
| ------------------------------------------------------------ | ---------------------------------------------- |
| [How to Run](#how-to-run)                                    | Run MediRipple locally                         |
| [System Architecture](#system-architecture)                  | Application structure and data flow            |
| [Website Navigation](#website-navigation)                    | Common navigation and analysis controls        |
| [1. Command Center](#1-command-center)                       | Main dashboard and network map                 |
| [2. Cascade & Spillover Intel](#2-cascade--spillover-intel)  | Shortage propagation simulation                |
| [3. Stock Trajectory](#3-stock-trajectory)                   | Inventory depletion and stockout projection    |
| [4. Risk Alerts & Priorities](#4-risk-alerts--priorities)    | Ranked facility risk alerts                    |
| [5. Facility Diagnostic Audit](#5-facility-diagnostic-audit) | Detailed facility-level analysis               |
| [6. Redistribution Actions](#6-redistribution-actions)       | Stock transfer and procurement recommendations |
| [7. Medicine & Stock Advisor](#7-medicine--stock-advisor)    | Medicine-level inventory and reorder analysis  |
| [Risk Classification](#risk-classification)                  | Meaning of facility risk levels                |
| [Application Workflow](#application-workflow)                | How the different pages work together          |
| [Technology Stack](#technology-stack)                        | Technologies used in the application           |
| [Project Structure](#project-structure)                      | Repository organization                         |
| [Page Summary](#page-summary)                                | Quick summary of all website pages             |


---

# How to Run

## Prerequisites

Make sure the following are installed:

* **Node.js**
* **pnpm**
* **PostgreSQL**

The repository specifies **pnpm 11.24.0** as its package manager and uses Next.js, React, TypeScript, PostgreSQL, Drizzle ORM, Leaflet, and Better Auth.

## 1. Clone the Repository

```bash
git clone https://github.com/UtkarshRaj212/Medi-Ripple.git
cd Medi-Ripple
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Configure Environment Variables

Create a `.env` file in the root directory and provide the required environment variables for the database and application configuration.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
```

Add any other environment variables required by the application configuration.

## 4. Set Up the Database

The project uses **Drizzle ORM** with PostgreSQL.

Available database commands include:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

These scripts are defined in the project's `package.json`.

For a development database, `db:push` can be used to synchronize the schema:

```bash
pnpm db:push
```

## 5. Start the Development Server

```bash
pnpm dev
```

The application will normally be available at:

```text
http://localhost:3000
```

## 6. Production Build

To create a production build:

```bash
pnpm build
```

Then start the production server:

```bash
pnpm start
```

---

# System Architecture

MediRipple is implemented as a **Next.js App Router application** with React and TypeScript on the application layer.

The repository is organized around the following major layers:

| Layer          | Technology / Component | Responsibility                                |
| -------------- | ---------------------- | --------------------------------------------- |
| Frontend       | React + Next.js        | User interface and page rendering             |
| Application    | Next.js App Router     | Routing and application structure             |
| Styling        | Tailwind CSS           | Interface styling                             |
| Maps           | OSM (Leaflet)          | Geographic facility and network visualization |
| Icons          | Lucide React           | Interface icons                               |
| Database       | PostgreSQL             | Persistent application data                   |
| ORM            | Drizzle ORM            | Database access and schema management         |
| Authentication | Better Auth            | Authentication functionality                  |
| Type System    | TypeScript             | Static typing                                 |
| Tooling        | pnpm                   | Dependency and project management             |

The dependencies and scripts are defined in the repository's `package.json`.


The deployed application initializes OpenStreetMap geographic tiles and facility coordinates for the Command Center map.

---

# Website Navigation

The MediRipple interface provides a common navigation area containing the major intelligence pages.

The current application exposes these seven pages:

| Page                          | Main Function                                         |
| ----------------------------- | ----------------------------------------------------- |
| **Network & Referral Map**    | Overall network view and district KPIs                |
| **Cascade & Spillover Intel** | Simulates shortage propagation                        |
| **Stock Trajectory**          | Projects inventory depletion                          |
| **Risk Alerts & Priorities**  | Shows ranked facility alerts                          |
| **Facility Diagnostic Audit** | Provides detailed facility analysis                   |
| **Redistribution Actions**    | Generates transfer and procurement actions            |
| **Medicine & Stock Advisor**  | Provides medicine-level stock and reorder information |

The same analysis context is shown across the application, including the selected **district, drug, and analysis horizon**.

---

# Analysis Controls

Before using the individual pages, the application provides common analysis controls.

## District

Selects the geographical district for the analysis.

The current demonstration scenario uses:

```text
Pune District
```

## Drug

Selects the medicine/formulation being analyzed.

The current demonstration scenario uses:

```text
Ceftriaxone 1g Inj
```

## Horizon

Defines the analysis period.

The current demonstration scenario uses:

```text
30 Days
```

## Run Analysis

The **Run Analysis** button applies the selected parameters and updates the displayed analysis.

These parameters remain visible while navigating through the different intelligence pages.

---

# 1. Command Center

## Network & Referral Map

The **Command Center** is the main landing page of MediRipple.

It combines the geographic network view with district-level supply-chain KPIs.

The page provides:

* Interactive facility map
* Facility locations
* Referral relationships
* District-level statistics
* Critical facility count
* At-risk facility count
* Expected stockouts
* Unmet demand
* Average days of inventory cover

The deployed application loads geographic tiles and facility coordinates using OpenStreetMap data.

## Macro Overview

The Command Center displays the following primary indicators.

### Critical Facilities

Facilities with an immediate stockout threat.

The current interface defines this condition as:

```text
≤ 5 days of cover
or
zero stock at T+0
```

### Facilities at Risk

Facilities entering the warning buffer.

The current interface uses:

```text
Depletion buffer ≤ 10 days
```

### Expected Stockouts

Number of facilities projected to reach zero inventory during the selected analysis window.

### Unmet Demand

Cumulative projected prescription deficit measured in medicine units.

### Average Days Cover

Average inventory autonomy across the analyzed facilities.

For the current demonstration scenario, the Command Center displays 3 critical facilities, 5 facilities in the warning buffer, 6 projected stockouts, 4,796 vials of unmet demand, and 15.1 average days of cover.

## Command Center Use

This page is primarily used for **situational awareness**.

It gives the user a quick view of the current supply-chain condition before moving into detailed analysis.

---

# 2. Cascade & Spillover Intel

## Cascade Propagation & Referral Spillover Simulation

The **Cascade & Spillover Intel** page models how a stockout at one facility can affect other facilities connected through the referral network.

The page specifically analyzes:

* Primary stockout
* Patient redirection
* Referral recipients
* Additional demand
* Secondary inventory depletion
* Secondary stockouts

## Simulation Scrubber

The page contains an interactive simulation scrubber covering:

```text
Day 0 → Day 30
```

Users can:

* Move to a specific simulation day
* Play the simulation
* Inspect the current simulation state
* Observe the changing cascade condition

The page displays the current simulation day and cascade state.

## Primary Epicenter

The **Primary Epicenter** is the facility where the initial stockout occurs.

In the current scenario:

```text
Aundh District Hospital
```

The projected stockout is:

```text
Day 5
```

The page also shows that the scheduled inbound delivery is expected on Day 9.

## Secondary Facilities

The page identifies facilities that directly receive redirected patients from the primary facility.

The current scenario contains six connected referral recipients:

* Baramati Sub-District Hospital
* Shirur Sub-District Hospital
* Haveli Community Health Center
* Junnar Community Health Center
* Paud Primary Health Center
* Wagholi Primary Health Center

## Cascade Metrics

The page provides quantitative metrics including:

| Metric                         |           Current Example |
| ------------------------------ | ------------------------: |
| Primary Stockout               |                     Day 5 |
| Secondary Facilities           |                         6 |
| Diverted Demand Rate           |            +106 vials/day |
| Additional Secondary Stockouts |              3 facilities |
| Cumulative Diverted Units      | Depends on simulation day |

The cumulative diverted units change as the simulation advances.

## Ripple Mechanics

The simulation models the effect of unmet demand at the primary facility being redirected to connected referral facilities.

This additional demand increases the consumption rate of the receiving facilities and can accelerate their inventory depletion.

The page therefore allows the user to inspect not only **when the first stockout occurs**, but also **how the resulting demand can affect the surrounding referral network**.

---

# 3. Stock Trajectory

## Inventory Depletion Trajectory & Stockout Horizon

The **Stock Trajectory** page provides a forward projection of medicine inventory for an individual facility.

The page focuses on:

* Current stock
* Consumption velocity
* Projected stock balance
* Safety threshold
* Stockout date
* Replenishment pipeline
* Replenishment arrival date

## Facility Selection

The user can select the facility whose inventory trajectory should be analyzed.

The page then displays the selected facility and target medicine.

## Projected Stock Balance

The main trajectory visualization shows how the selected medicine's inventory changes throughout the analysis period.

The interface identifies:

* Projected stock
* Projected variance
* Safety threshold
* Zero-stock level

The trajectory can also be interacted with to move the simulation day.

## Stock Coverage

The page calculates the number of days the current inventory can support the current consumption rate.

For the current example:

```text
Current Stock: 384 vials
Burn Velocity: 80 vials/day
Days of Cover: 4.8 days
```

## Projected Stockout

The page estimates when inventory reaches zero.

Current example:

```text
Projected Stockout: Day 5
```

## Pipeline Arrival

The page also considers incoming inventory.

Current example:

```text
Incoming: 200 vials
Arrival: Day 9
```

This allows the user to compare projected depletion with the expected replenishment date.

## Safety Stock

The page displays the required safety-stock level.

Current example:

```text
Safety Stock: 800 vials
```

This provides a reference point for determining whether the projected inventory remains within an acceptable buffer.

---

# 4. Risk Alerts & Priorities

## Ranked Facility Risk Alerts & Triage Feed

The **Risk Alerts & Priorities** page provides a ranked list of facilities according to their supply-chain risk.

The page summarizes:

* Total monitored facilities
* Critical facilities
* Warning facilities
* Stable facilities
* Active alerts

## Risk Summary

The current scenario contains:

| Category        | Facilities |
| --------------- | ---------: |
| Total Monitored |          9 |
| Critical        |          3 |
| Warning         |          2 |
| Stable          |          4 |
| Active Alerts   |          5 |

## Alert Ranking

The active alerts are ranked using indicators such as:

* Stockout probability
* Inventory depletion velocity
* Immediate days of cover
* Pipeline buffer

## Alert Information

Each alert provides:

* Facility name
* Facility type
* Stockout risk
* Immediate days of cover
* Pipeline buffer
* Pipeline quantity
* Facility audit access

For example, the current scenario shows Junnar Community Health Center with 98% stockout risk and 3.8 days of cover, while Aundh District Hospital has 98% stockout risk and 4.8 days of cover.

## Filters

The page provides alert filtering options for:

* All Alerts
* Critical
* Warning

This allows users to focus on a particular severity category.

## Audit

Each alert provides access to the corresponding **Facility Diagnostic Audit**, allowing the user to move from a high-level warning to a detailed facility investigation.

---

# 5. Facility Diagnostic Audit

## Facility Operational Diagnostic Audit

The **Facility Diagnostic Audit** provides a detailed operational view of individual healthcare facilities.

It combines inventory information with facility capacity and referral-network information.

The page includes:

* Facility roster
* Facility risk status
* Days of cover
* Current stock
* Daily consumption
* Stockout risk
* Replenishment status
* Operational diagnosis
* Bed capacity
* Catchment population
* Referral connections
* Referral inflow
* Transit-time information

## Facility Roster

The roster lists the monitored facilities along with their current status.

The current dataset contains nine facilities, including:

* Aundh District Hospital
* Baramati Sub-District Hospital
* Shirur Sub-District Hospital
* Haveli Community Health Center
* Junnar Community Health Center
* Indapur Rural Health Center
* Paud Primary Health Center
* Wagholi Primary Health Center
* Khadakwasla Health Center

Each facility entry displays:

* Facility type
* Healthcare tier
* Risk level
* Days of cover
* Current stock

## Detailed Facility View

Selecting a facility opens its detailed audit.

For example, the current Aundh District Hospital audit provides:

| Parameter            |        Value |
| -------------------- | -----------: |
| Facility Tier        |     Tertiary |
| Current Stock        |    384 vials |
| Daily Consumption    | 80 vials/day |
| Days of Cover        |     4.8 days |
| Stockout Risk        |          98% |
| Inbound Pipeline     |    200 vials |
| Expected Arrival     |        Day 9 |
| Bed Capacity         |     450 beds |
| Catchment Population |      850,000 |

## Operational Diagnostic

The page provides an operational explanation associated with the facility's risk condition.

For the current Aundh scenario, the diagnostic identifies:

```text
Replenishment delay + patient surge
```

The page reports a replenishment delay and an increase in patient demand as contributing conditions.

## Referral Transfer Routes

The detailed audit also shows the facilities connected to the selected facility.

For Aundh District Hospital, the interface displays incoming referral relationships from facilities including:

* Paud Primary Health Center
* Wagholi Primary Health Center
* Haveli Community Health Center
* Junnar Community Health Center
* Shirur Sub-District Hospital
* Baramati Sub-District Hospital

For each route, the interface provides referral volume information and estimated transit time.

---

# 6. Redistribution Actions

## Redistribution & Intervention Recommendations

The **Redistribution Actions** page converts the identified inventory deficits into possible intervention actions.

The page analyzes the network for:

* Surplus facilities
* Deficit facilities
* Internal redistribution capacity
* Stock transfers
* External procurement requirements
* Facilities that can be stabilized through transfers

## Network Summary

The current scenario displays:

| Metric                    |     Value |
| ------------------------- | --------: |
| Surplus Sites             |         4 |
| Deficit Sites             |         5 |
| Internal Network Coverage |       82% |
| Transfers                 |         6 |
| Transfer Quantity         | 605 vials |
| External Procurements     |         3 |
| Stabilized Facilities     |         2 |
| Total Deficit             | 735 vials |

The application calculates that 605 of the 735-vial deficit can be covered through internal redistribution, leaving 130 vials requiring external procurement.

## Prioritized Action Queue

The page generates a prioritized queue of recommended actions.

Actions are categorized as:

### Emergency Procurement

These actions identify facilities where additional stock must be externally procured.

Each procurement action includes information such as:

* Facility
* Required quantity
* Current stock
* Daily burn
* Projected stockout

### Transfer

Transfer actions identify a donor facility and recipient facility.

Each transfer includes:

* Donor facility
* Recipient facility
* Transfer quantity
* Transit time
* Additional days of cover for recipient
* Remaining days of cover for donor

## Example Transfer

One current recommendation transfers:

```text
243 vials
Baramati Sub-District Hospital
→
Aundh District Hospital
```

The interface reports approximately:

```text
Transit Time: 2 hours
Recipient Impact: +3 days cover
Donor Remaining Cover: 17 days
```

This allows the redistribution system to consider both sides of the transfer instead of only looking at the recipient's shortage.

---

# 7. Medicine & Stock Advisor

## Medicine & Stock Advisor

The **Medicine & Stock Advisor** is the medicine-level inventory page.

Unlike the other pages, which primarily analyze facility and network risk, this page focuses on the medicines held by an individual hospital.

The page provides:

* Hospital selection
* Medicine inventory
* Stock status
* Medicine category
* Reorder recommendation
* Suggested quantity
* Order date
* Safety-stock level
* Nearby inventory

## Hospital Selection

The user selects a hospital to inspect its medicine inventory.

The selected hospital's medicines are then displayed in a table.

## Medicine Inventory

For the current Aundh District Hospital scenario, the page displays four medicines:

| Medicine                 | Category            | Stock | Status   |
| ------------------------ | ------------------- | ----: | -------- |
| Ceftriaxone 1g Inj       | Critical Antibiotic |   384 | Critical |
| Artesunate 60mg Inj      | Antimalarial Care   |   440 | Warning  |
| Oxytocin 10 IU/ml        | Maternal Health     |  1700 | Low      |
| Insulin Regular 40 IU/ml | Endocrine Critical  |  1600 | Low      |

## Reorder Advisor

Selecting a medicine provides a detailed reorder recommendation.

For the current Ceftriaxone example, the advisor reports:

```text
Order Status: Urgent
Order By: Today
Current Days of Cover: 4.8 days
Safety Stock: 800 vials
Suggested Quantity: 1136 vials
Lead Time: 7 days
```

The recommendation includes an additional two-day buffer when calculating the recommended order timing and quantity.

## Nearby Stock

The page also searches for available inventory at hospitals within a **10 km radius**.

The current example identifies:

```text
Haveli Community Health Center
Distance: 8.5 km
Available: 90 vials
```

This provides visibility into nearby stock that could potentially be considered before relying entirely on external procurement.

---

# Risk Classification

The application uses inventory coverage to classify facilities.

| Classification   | Condition / Meaning                                          |
| ---------------- | ------------------------------------------------------------ |
| **Critical**     | Immediate stockout threat or very low inventory coverage     |
| **Warning**      | Facility is approaching the depletion threshold              |
| **Stable / Low** | Facility maintains a comparatively healthy inventory reserve |

The Command Center defines the critical condition around **5 days of cover or zero stock at the current simulation point**, while the warning buffer extends to approximately **10 days of cover**.

The Risk Alerts page applies these classifications to individual facilities and ranks active alerts using stockout probability and depletion velocity.

---

# Application Workflow

The different pages are designed to be used together.

A typical analysis can follow this sequence:

```text
Configure Parameters
        ↓
Command Center
        ↓
Risk Alerts
        ↓
Facility Audit
        ↓
Stock Trajectory
        ↓
Cascade Simulation
        ↓
Redistribution Actions
        ↓
Medicine & Stock Advisor
```

### Configure Parameters

Select the district, medicine, and analysis horizon.

### Command Center

Get the overall network condition and district-level KPIs.

### Risk Alerts

Identify which facilities require attention.

### Facility Audit

Investigate the operational condition of a selected facility.

### Stock Trajectory

Determine when its inventory is projected to reach critical or zero levels.

### Cascade Simulation

Examine how a shortage can affect connected referral facilities.

### Redistribution Actions

Identify possible stock transfers and external procurement requirements.

### Medicine & Stock Advisor

Examine medicine-specific reorder requirements and nearby inventory.

---

# Technology Stack

| Technology        | Usage                                   |
| ----------------- | --------------------------------------- |
| **Next.js 16**    | Full-stack web application framework    |
| **React 19**      | User interface                          |
| **TypeScript**    | Application development and type safety |
| **Tailwind CSS**  | UI styling                              |
| **Leaflet**       | Interactive geographic maps             |
| **OpenStreetMap** | Geographic map tiles                    |
| **PostgreSQL**    | Database                                |
| **Drizzle ORM**   | Database ORM and migrations             |
| **Better Auth**   | Authentication                          |
| **Lucide React**  | UI icons                                |
| **pnpm**          | Package management                      |

These dependencies are defined in the project's `package.json`.

---

The repository contains dedicated `app`, `components`, `lib`, `drizzle`, `public`, and `scripts` directories.

---

# Page Summary

| Page                          | Main Information                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **Command Center**            | Network map, facility locations, referral network, district KPIs                  |
| **Cascade & Spillover Intel** | Patient deflection, referral spillover, simulation timeline, secondary stockouts  |
| **Stock Trajectory**          | Inventory curve, consumption rate, stockout date, pipeline delivery, safety stock |
| **Risk Alerts & Priorities**  | Ranked alerts, stockout risk, days of cover, pipeline buffer                      |
| **Facility Diagnostic Audit** | Facility inventory, operational condition, capacity, catchment, referral routes   |
| **Redistribution Actions**    | Surplus/deficit analysis, transfers, procurement, action queue                    |
| **Medicine & Stock Advisor**  | Hospital medicines, reorder timing, suggested quantity, nearby stock              |
