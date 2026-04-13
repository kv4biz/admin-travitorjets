// src/lib/content/index.ts
export const content = {
  // ============================================
  // DASHBOARD (shared layout)
  // ============================================
  dashboard: {
    sidebar: {
      header: {
        logo: "/logo.svg",
        title: "Traviator Jets",
      },
      mainLinks: [
        {
          href: "/",
          label: "Dashboard",
          icon: "LayoutDashboard",
          managerOnly: false,
        },
        {
          href: "/requests",
          label: "Requests",
          icon: "FileText",
          managerOnly: false,
        },
        {
          href: "/empty-legs",
          label: "Empty Legs",
          icon: "Plane",
          managerOnly: false,
        },
        {
          href: "/aircraft-types",
          label: "Aircraft Types",
          icon: "Plane",
          managerOnly: false,
        },
        {
          href: "/aircraft-listings",
          label: "Aircraft Listings",
          icon: "ShoppingCart",
          managerOnly: false,
        },
        {
          href: "/invoices",
          label: "Invoices",
          icon: "CreditCard",
          managerOnly: true,
        },
        {
          href: "/payments",
          label: "Payments",
          icon: "DollarSign",
          managerOnly: true,
        },
        {
          href: "/documents",
          label: "Documents",
          icon: "Folder",
          managerOnly: true,
        },
        {
          href: "/staffs",
          label: "Staff Management",
          icon: "Users",
          managerOnly: true,
        },
        {
          href: "/analytics",
          label: "Analytics",
          icon: "BarChart",
          managerOnly: true,
        },
        {
          href: "/settings",
          label: "Settings",
          icon: "Settings",
          managerOnly: false,
        },
      ],
      requestsTitle: "Your Requests",
      noRequests: "No assigned requests.",
      moreButton: "More",
      maxRequests: 4,
    },
    topBar: {
      profile: {
        profile: "Profile",
        settings: "Settings",
        logout: "Logout",
        manageTeam: "Manage Team",
      },
    },
  },

  // ============================================
  // PAGES (CRUD labels, etc.)
  // ============================================
  pages: {
    emptyLegs: {
      title: "Empty Legs Management",
      createButton: "Create Empty Leg",
      editButton: "Edit",
      deleteButton: "Delete",
      columns: {
        source: "Source",
        route: "Route",
        dates: "Dates",
        price: "Price",
        status: "Public",
      },
      form: {
        source: "Source",
        aircraftType: "Aircraft Type",
        depAirport: "Departure Airport",
        arrAirport: "Arrival Airport",
        fromDate: "From Date",
        toDate: "To Date",
        priceType: "Price Type",
        price: "Price (USD)",
        isPublic: "Make Public on Website",
        destinationImage: "Destination Image URL",
        destinationDescription: "Destination Description",
        comment: "Comment",
        submit: "Save Empty Leg",
      },
      messages: {
        created: "Empty leg created successfully",
        updated: "Empty leg updated successfully",
        deleted: "Empty leg deleted successfully",
        confirmDelete: "Are you sure you want to delete this empty leg?",
      },
    },
    aircraftTypes: {
      title: "Aircraft Types",
      createButton: "Create Aircraft Type",
      // similar structure...
    },
    // other pages follow same pattern
  },
} as const;

export type Content = typeof content;
