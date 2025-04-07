# Family Structure Documentation

This document outlines the family structure implemented in the Family App, including the relationships between family members and their roles within the family.

## Family Members

| ID | Name | Role | Relationship Type |
|----|------|------|------------------|
| 1 | John Smith | Father | biological |
| 2 | Jane Smith | Mother | biological |
| 3 | Emma Smith | Daughter | biological |
| 4 | Liam Smith | Son | biological |
| 5 | Margaret Wilson | Grandmother | biological |
| 6 | Robert Wilson | Grandfather | biological |
| 7 | Michael Johnson | Uncle | extended |
| 8 | Sophia Johnson | Aunt | extended |
| 9 | Olivia Johnson | Cousin | extended |
| 10 | James Taylor | Step-father | step |
| 11 | Ella Williams | Family Friend | honorary |

## Family Structure

### Core Family
- **John and Jane Smith**: Married couple with two children
- **Emma and Liam Smith**: Children of John and Jane

### Extended Family
- **Margaret and Robert Wilson**: Jane's parents (maternal grandparents to Emma and Liam)
- **Michael Johnson**: Jane's brother (uncle to Emma and Liam)
- **Sophia Johnson**: Michael's wife (aunt to Emma and Liam)
- **Olivia Johnson**: Michael and Sophia's daughter (cousin to Emma and Liam)

### Blended Family Elements
- **James Taylor**: Jane's ex-husband, maintains a step-parent relationship with Emma and Liam
- **Ella Williams**: Close family friend who is considered part of the extended family

## Key Relationships

### Parent-Child Relationships
- John Smith → Emma Smith (father-daughter)
- John Smith → Liam Smith (father-son)
- Jane Smith → Emma Smith (mother-daughter)
- Jane Smith → Liam Smith (mother-son)
- Robert Wilson → Jane Smith (father-daughter)
- Margaret Wilson → Jane Smith (mother-daughter)
- Michael Johnson → Olivia Johnson (father-daughter)
- Sophia Johnson → Olivia Johnson (mother-daughter)

### Grandparent Relationships
- Robert Wilson → Emma Smith (grandfather-granddaughter)
- Robert Wilson → Liam Smith (grandfather-grandson)
- Margaret Wilson → Emma Smith (grandmother-granddaughter)
- Margaret Wilson → Liam Smith (grandmother-grandson)

### Marriage and Partnership
- John Smith ↔ Jane Smith (current marriage)
- Robert Wilson ↔ Margaret Wilson (long-term marriage)
- Michael Johnson ↔ Sophia Johnson (marriage)
- Jane Smith ↔ James Taylor (former marriage, now divorced)

### Sibling Relationships
- Emma Smith ↔ Liam Smith (siblings)
- Jane Smith ↔ Michael Johnson (siblings)

### Extended Family Relationships
- Olivia Johnson ↔ Emma Smith (cousins, close relationship)
- Olivia Johnson ↔ Liam Smith (cousins)
- John Smith ↔ Michael Johnson (brothers-in-law)
- John Smith ↔ Sophia Johnson (in-laws)
- John Smith ↔ Margaret Wilson (son-in-law/mother-in-law)
- John Smith ↔ Robert Wilson (son-in-law/father-in-law)

### Honorary Relationships
- Ella Williams ↔ John Smith (close friends)
- Ella Williams ↔ Jane Smith (close friends)

## Visualization Notes

The family tree visualization should display the family in a hierarchical structure:
- Top level: Margaret and Robert Wilson (grandparents)
- Middle level: John and Jane Smith (parents) and Michael and Sophia Johnson (aunt/uncle)
- Bottom level: Emma and Liam Smith (children) and Olivia Johnson (cousin)

Special relationships like James Taylor (step-father) and Ella Williams (family friend) should be displayed with different visual indicators to show their honorary or non-biological connection to the family.
