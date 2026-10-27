const { Property, Requirement, BlogPost, Report } = require('../schema');

const seedData = async () => {
  try {
    const propCount = await Property.count();
    if (propCount === 0) {
      await Property.bulkCreate([
        {
          sellerId: 1,
          propertyType: 'Apartment',
          purpose: 'Sale',
          propertyFor: 'sale',
          area: 'Uttara, Dhaka',
          sector: 'Sector 7',
          city: 'Dhaka',
          address: 'Road 14, House 22, Sector 7, Uttara',
          sizeSqFt: 1450,
          price: 13500000,
          bedrooms: '3',
          bathrooms: '3',
          balcony: '2',
          floor: 6,
          totalFloors: 9,
          amenities: ['Lift', 'Generator', 'Gas line', 'Security', 'Rooftop', 'CCTV'],
          contactNumber: '01711234567',
          status: 'verified',
        },
        {
          sellerId: 1,
          propertyType: 'Apartment',
          purpose: 'Rent',
          propertyFor: 'rent',
          area: 'Dhanmondi, Dhaka',
          sector: 'Road 8A',
          city: 'Dhaka',
          address: 'Road 8A, Dhanmondi',
          sizeSqFt: 1250,
          price: 32000,
          bedrooms: '3',
          bathrooms: '2',
          balcony: '2',
          floor: 4,
          totalFloors: 7,
          amenities: ['Lift', 'Generator', 'Gas line', 'Security'],
          contactNumber: '01711234567',
          status: 'verified',
        },
        {
          sellerId: 1,
          propertyType: 'Duplex',
          purpose: 'Sale',
          propertyFor: 'sale',
          area: 'Gulshan, Dhaka',
          sector: 'Gulshan 2',
          city: 'Dhaka',
          address: 'Road 45, Gulshan 2',
          sizeSqFt: 2600,
          price: 29000000,
          bedrooms: '4',
          bathrooms: '4',
          balcony: '3',
          floor: 7,
          totalFloors: 8,
          amenities: ['Lift', 'Generator', 'Gym', 'Security', 'CCTV', 'Rooftop garden'],
          contactNumber: '01711234567',
          status: 'verified',
        },
      ]);
      console.log('Seeded prototype properties');
    }

    const postCount = await BlogPost.count();
    if (postCount === 0) {
      await BlogPost.bulkCreate([
        {
          slug: 'uttara-sector-guide-for-families',
          title: 'Uttara sector guide for families: where to rent or buy',
          category: 'area-guides',
          excerpt: "Older sectors, lakeside sectors or the newer third phase? How to choose the right part of Uttara for your family's budget, schools and commute.",
          metaTitle: 'Uttara Sector Guide for Families (2026) | TrueSpace Property',
          metaDesc: "Compare Uttara's sectors for family living: established Sectors 1–7, central Sectors 9–14 and newer Sectors 15–18.",
          readTime: 6,
          views: 2310,
          tags: ['Uttara', 'family homes', 'area guide'],
          status: 'published',
        },
        {
          slug: 'documents-to-check-before-buying-a-flat-in-dhaka',
          title: '8 documents to check before you buy a flat in Dhaka',
          category: 'legal-documents',
          excerpt: 'From the title deed to the RAJUK-approved plan: the papers a buyer should see, and what each one proves, before paying any booking money.',
          metaTitle: '8 Documents to Check Before Buying a Dhaka Flat | TrueSpace',
          metaDesc: 'Title deed, khatian, mutation, khajna receipts, RAJUK approval and more.',
          readTime: 7,
          views: 3120,
          tags: ['documents', 'mutation', 'buying'],
          status: 'published',
        },
      ]);
      console.log('Seeded prototype blog posts');
    }

    const reportCount = await Report.count();
    if (reportCount === 0) {
      await Report.bulkCreate([
        {
          reportId: 'R-88',
          type: 'Listing',
          target: 'TSP-1008',
          reason: 'Photos look like a different building',
          reportedBy: 'Buyer',
          severity: 'High',
          status: 'pending',
        },
        {
          reportId: 'R-86',
          type: 'User',
          target: 'Mahmudul Islam',
          reason: 'Asked for an advance outside TrueSpace',
          reportedBy: 'Tenant',
          severity: 'High',
          status: 'pending',
        },
      ]);
      console.log('Seeded prototype reports');
    }
  } catch (err) {
    console.warn('Seeding note:', err.message);
  }
};

module.exports = seedData;
