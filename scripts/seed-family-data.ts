import { db } from "../server/db";
import {
  users,
  familyMembers,
  relationships,
  events,
  documents,
  helpRequests,
  messages,
} from "../shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Clearing existing data...");
  try {
    await db.delete(messages);
    await db.delete(helpRequests);
    await db.delete(documents);
    await db.delete(events);
    await db.delete(relationships);
    await db.delete(familyMembers);
    await db.delete(users);
    console.log("Data cleared successfully!");
  } catch (error) {
    console.error("Error clearing data:", error);
    return;
  }

  console.log("Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  await db.insert(users).values([
    {
      id: 1,
      username: "admin",
      password: "password123",
      name: "Admin User",
      email: "admin@familyapp.com",
      role: "admin",
    },
    {
      id: 2,
      username: "user",
      password: "password123",
      name: "Regular User",
      email: "user@familyapp.com",
      role: "member",
    },
  ]);

  console.log("Users created successfully!");

  console.log("Creating inclusive family members...");

  const members = [
    {
      id: 1,
      name: "John Smith",
      role: "Father",
      relationship: "biological",
      birth_date: new Date("1980-05-15"),
      location: "Seattle, WA",
      bio: "Father of two, loves hiking and fishing.",
      personality_traits: ["responsible", "outdoorsy"],
      interests: ["hiking", "fishing"],
      occupation: "Engineer",
      metadata: { pronouns: "he/him" },
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "Mother",
      relationship: "biological",
      birth_date: new Date("1982-09-23"),
      location: "Seattle, WA",
      bio: "Mother of two, healthcare professional.",
      personality_traits: ["nurturing", "organized"],
      interests: ["gardening", "reading"],
      occupation: "Nurse",
      metadata: { pronouns: "she/her" },
    },
    {
      id: 3,
      name: "Emma Smith",
      role: "Daughter",
      relationship: "biological",
      birth_date: new Date("2010-03-12"),
      location: "Seattle, WA",
      bio: "Loves drawing and dancing.",
      personality_traits: ["creative"],
      interests: ["drawing", "ballet"],
      occupation: "Student",
      metadata: {},
    },
    {
      id: 4,
      name: "Liam Smith",
      role: "Son",
      relationship: "biological",
      birth_date: new Date("2012-11-08"),
      location: "Seattle, WA",
      bio: "Enjoys soccer and video games.",
      personality_traits: ["active", "funny"],
      interests: ["soccer", "gaming"],
      occupation: "Student",
      metadata: {},
    },
    {
      id: 5,
      name: "Margaret Wilson",
      role: "Grandmother",
      relationship: "biological",
      birth_date: new Date("1955-04-30"),
      location: "Portland, OR",
      bio: "Retired teacher who loves gardening.",
      personality_traits: ["wise", "gentle"],
      interests: ["gardening", "cooking"],
      occupation: "Retired",
      metadata: {},
    },
    {
      id: 6,
      name: "Robert Wilson",
      role: "Grandfather",
      relationship: "biological",
      birth_date: new Date("1953-08-17"),
      location: "Portland, OR",
      bio: "Retired engineer with a passion for woodworking.",
      personality_traits: ["methodical", "quiet"],
      interests: ["woodworking", "history"],
      occupation: "Retired",
      metadata: {},
    },
    {
      id: 12,
      name: "Alex Rivera",
      role: "Parent",
      relationship: "chosen",
      birth_date: new Date("1989-06-11"),
      location: "Brooklyn, NY",
      bio: "Co-parenting in a platonic chosen family.",
      personality_traits: ["empathetic"],
      interests: ["art", "coffee"],
      occupation: "Social Worker",
      metadata: {
        pronouns: "they/them",
        family_type: "chosen",
        parental_model: "multi-parent",
      },
    },
    {
      id: 13,
      name: "Sam Lee",
      role: "Parent",
      relationship: "chosen",
      birth_date: new Date("1990-12-20"),
      location: "Brooklyn, NY",
      bio: "Creative writer and co-parent.",
      personality_traits: ["creative", "loyal"],
      interests: ["writing", "travel"],
      occupation: "Author",
      metadata: {
        pronouns: "she/her",
        family_type: "chosen",
        parental_model: "multi-parent",
      },
    },
    {
      id: 14,
      name: "Kai Rivera-Lee",
      role: "Child",
      relationship: "chosen",
      birth_date: new Date("2020-08-14"),
      location: "Brooklyn, NY",
      bio: "Child with multiple co-parents.",
      personality_traits: ["curious"],
      interests: ["blocks", "books"],
      occupation: "Toddler",
      metadata: {},
    },
    {
      id: 15,
      name: "Jordan Thomas",
      role: "Co-Parent",
      relationship: "multi-parent",
      birth_date: new Date("1985-03-05"),
      location: "Brooklyn, NY",
      bio: "Part of a poly family raising Kai.",
      personality_traits: ["thoughtful"],
      interests: ["design", "cycling"],
      occupation: "Architect",
      metadata: {
        pronouns: "he/him",
        family_type: "polygamous",
        parental_model: "multi-parent",
      },
    },
  ];

  await db.insert(familyMembers).values(members);
  console.log("Family members created successfully!");

  console.log("Creating relationships...");
  const relationshipData = [
    // Traditional parents to children
    {
      source_id: 1,
      target_id: 3,
      relationship_type: "parent",
      relation_category: "biological",
      notes: "",
    },
    {
      source_id: 1,
      target_id: 4,
      relationship_type: "parent",
      relation_category: "biological",
      notes: "",
    },
    {
      source_id: 2,
      target_id: 3,
      relationship_type: "parent",
      relation_category: "biological",
      notes: "",
    },
    {
      source_id: 2,
      target_id: 4,
      relationship_type: "parent",
      relation_category: "biological",
      notes: "",
    },

    // Spousal
    {
      source_id: 1,
      target_id: 2,
      relationship_type: "spouse",
      relation_category: "biological",
      notes: "Married 15 years",
    },

    // Grandparents
    {
      source_id: 5,
      target_id: 2,
      relationship_type: "parent",
      relation_category: "biological",
      notes: "Mother",
    },
    {
      source_id: 6,
      target_id: 2,
      relationship_type: "parent",
      relation_category: "biological",
      notes: "Father",
    },

    // Chosen Family
    {
      source_id: 12,
      target_id: 13,
      relationship_type: "platonic-partner",
      relation_category: "chosen",
      notes: "Co-parenting relationship",
    },
    {
      source_id: 12,
      target_id: 14,
      relationship_type: "parent",
      relation_category: "chosen",
      notes: "",
    },
    {
      source_id: 13,
      target_id: 14,
      relationship_type: "parent",
      relation_category: "chosen",
      notes: "",
    },

    // Poly-family co-parenting
    {
      source_id: 15,
      target_id: 14,
      relationship_type: "parent",
      relation_category: "multi-parent",
      notes: "Co-parent role",
    },
    {
      source_id: 13,
      target_id: 15,
      relationship_type: "polygamous",
      relation_category: "chosen",
      notes: "Part of poly parenting structure",
    },

    // Extended
    {
      source_id: 1,
      target_id: 5,
      relationship_type: "in-law",
      relation_category: "biological",
      notes: "Mother-in-law",
    },
    {
      source_id: 1,
      target_id: 6,
      relationship_type: "in-law",
      relation_category: "biological",
      notes: "Father-in-law",
    },
  ];

  await db.insert(relationships).values(relationshipData);
  console.log("Relationships created successfully!");

  console.log("Seeding completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error during seeding:", err);
    process.exit(1);
  });
