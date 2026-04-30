export interface Upazila {
  id: string;
  district_id: string;
  name: string;
  bn_name: string;
}

export interface District {
  id: string;
  division_id: string;
  name: string;
  bn_name: string;
}

export interface Division {
  id: string;
  name: string;
  bn_name: string;
}

export const divisions: Division[] = [
  { id: "1", name: "Barishal", bn_name: "বরিশাল" },
  { id: "2", name: "Chattogram", bn_name: "চট্টগ্রাম" },
  { id: "3", name: "Dhaka", bn_name: "ঢাকা" },
  { id: "4", name: "Khulna", bn_name: "খুলনা" },
  { id: "5", name: "Rajshahi", bn_name: "রাজশাহী" },
  { id: "6", name: "Rangpur", bn_name: "রংপুর" },
  { id: "7", name: "Sylhet", bn_name: "সিলেট" },
  { id: "8", name: "Mymensingh", bn_name: "ময়মনসিংহ" }
];

export const districts: District[] = [
  { id: "1", division_id: "3", name: "Dhaka", bn_name: "ঢাকা" },
  { id: "2", division_id: "3", name: "Gazipur", bn_name: "গাজীপুর" },
  { id: "3", division_id: "3", name: "Narayanganj", bn_name: "নারায়ণগঞ্জ" },
  { id: "4", division_id: "3", name: "Manikganj", bn_name: "মানিকগঞ্জ" },
  { id: "5", division_id: "3", name: "Munshiganj", bn_name: "মুন্সীগঞ্জ" },
  { id: "6", division_id: "3", name: "Narsingdi", bn_name: "নরসিংদী" },
  { id: "7", division_id: "3", name: "Tangail", bn_name: "টাঙ্গাইল" },
  { id: "8", division_id: "3", name: "Faridpur", bn_name: "ফরিদপুর" },
  { id: "9", division_id: "3", name: "Gopalganj", bn_name: "গোপালগঞ্জ" },
  { id: "10", division_id: "3", name: "Madaripur", bn_name: "মাদারীপুর" },
  { id: "11", division_id: "3", name: "Rajbari", bn_name: "রাজবাড়ী" },
  { id: "12", division_id: "3", name: "Shariatpur", bn_name: "শরীয়তপুর" },
  { id: "13", division_id: "3", name: "Kishoreganj", bn_name: "কিশোরগঞ্জ" },
  
  { id: "14", division_id: "2", name: "Chattogram", bn_name: "চট্টগ্রাম" },
  { id: "15", division_id: "2", name: "Cox's Bazar", bn_name: "কক্সবাজার" },
  { id: "16", division_id: "2", name: "Noakhali", bn_name: "নোয়াখালী" },
  { id: "17", division_id: "2", name: "Feni", bn_name: "ফেনী" },
  { id: "18", division_id: "2", name: "Lakshmipur", bn_name: "লক্ষ্মীপুর" },
  { id: "19", division_id: "2", name: "Chandpur", bn_name: "চাঁদপুর" },
  { id: "20", division_id: "2", name: "Cumilla", bn_name: "কুমিল্লা" },
  { id: "21", division_id: "2", name: "Brahmanbaria", bn_name: "ব্রাহ্মণবাড়িয়া" },
  { id: "22", division_id: "2", name: "Khagrachhari", bn_name: "খাগড়াছড়ি" },
  { id: "23", division_id: "2", name: "Rangamati", bn_name: "রাঙ্গামাটি" },
  { id: "24", division_id: "2", name: "Bandarban", bn_name: "বান্দরবান" },

  { id: "25", division_id: "5", name: "Rajshahi", bn_name: "রাজশাহী" },
  { id: "26", division_id: "5", name: "Bogura", bn_name: "বগুড়া" },
  { id: "27", division_id: "5", name: "Pabna", bn_name: "পাবনা" },
  { id: "28", division_id: "5", name: "Joypurhat", bn_name: "জয়পুরহাট" },
  { id: "29", division_id: "5", name: "Naogaon", bn_name: "নওগাঁ" },
  { id: "30", division_id: "5", name: "Natore", bn_name: "নাটোর" },
  { id: "31", division_id: "5", name: "Chapai Nawabganj", bn_name: "চাঁপাইনবাবগঞ্জ" },
  { id: "32", division_id: "5", name: "Sirajganj", bn_name: "সিরাজগঞ্জ" },

  { id: "33", division_id: "4", name: "Khulna", bn_name: "খুলনা" },
  { id: "34", division_id: "4", name: "Bagherhat", bn_name: "বাগেরহাট" },
  { id: "35", division_id: "4", name: "Satkhira", bn_name: "সাতক্ষীরা" },
  { id: "36", division_id: "4", name: "Jashore", bn_name: "যশোর" },
  { id: "37", division_id: "4", name: "Magura", bn_name: "মাগুরা" },
  { id: "38", division_id: "4", name: "Narail", bn_name: "নড়াইল" },
  { id: "39", division_id: "4", name: "Kushtia", bn_name: "কুষ্টিয়া" },
  { id: "40", division_id: "4", name: "Chuadanga", bn_name: "চুয়াডাঙ্গা" },
  { id: "41", division_id: "4", name: "Meherpur", bn_name: "মেহেরপুর" },
  { id: "42", division_id: "4", name: "Jhenaidah", bn_name: "ঝিনাইদহ" },

  { id: "43", division_id: "1", name: "Barishal", bn_name: "বরিশাল" },
  { id: "44", division_id: "1", name: "Patuakhali", bn_name: "পটুয়াখালী" },
  { id: "45", division_id: "1", name: "Bhola", bn_name: "ভোলা" },
  { id: "46", division_id: "1", name: "Pirojpur", bn_name: "পিরোজপুর" },
  { id: "47", division_id: "1", name: "Barguna", bn_name: "বরগুনা" },
  { id: "48", division_id: "1", name: "Jhalokati", bn_name: "ঝালকাঠি" },

  { id: "49", division_id: "7", name: "Sylhet", bn_name: "সিলেট" },
  { id: "50", division_id: "7", name: "Moulvibazar", bn_name: "মৌলভীবাজার" },
  { id: "51", division_id: "7", name: "Habiganj", bn_name: "হবিগঞ্জ" },
  { id: "52", division_id: "7", name: "Sunamganj", bn_name: "সুনামগঞ্জ" },

  { id: "53", division_id: "6", name: "Rangpur", bn_name: "রংপুর" },
  { id: "54", division_id: "6", name: "Gaibandha", bn_name: "গাইবান্ধা" },
  { id: "55", division_id: "6", name: "Nilphamari", bn_name: "নীলফামারী" },
  { id: "56", division_id: "6", name: "Kurigram", bn_name: "কুড়িগ্রাম" },
  { id: "57", division_id: "6", name: "Lalmonirhat", bn_name: "লালমনিরহাট" },
  { id: "58", division_id: "6", name: "Dinajpur", bn_name: "দিনাজপুর" },
  { id: "59", division_id: "6", name: "Thakurgaon", bn_name: "ঠাকুরগাঁও" },
  { id: "60", division_id: "6", name: "Panchagarh", bn_name: "পঞ্চগড়" },

  { id: "61", division_id: "8", name: "Mymensingh", bn_name: "ময়মনসিংহ" },
  { id: "62", division_id: "8", name: "Jamalpur", bn_name: "জামালপুর" },
  { id: "63", division_id: "8", name: "Netrokona", bn_name: "নেত্রকোণা" },
  { id: "64", division_id: "8", name: "Sherpur", bn_name: "শেরপুর" },
];

export const upazilas: Upazila[] = [
  // Dhaka District
  { id: "1", district_id: "1", name: "Dhamrai", bn_name: "ধামরাই" },
  { id: "2", district_id: "1", name: "Dohar", bn_name: "দোহার" },
  { id: "3", district_id: "1", name: "Keraniganj", bn_name: "কেরাণীগঞ্জ" },
  { id: "4", district_id: "1", name: "Nawabganj", bn_name: "নবাবগঞ্জ" },
  { id: "5", district_id: "1", name: "Savar", bn_name: "সাভার" },
  { id: "6", district_id: "1", name: "Dhaka North City Corporation", bn_name: "ঢাকা উত্তর সিটি কর্পোরেশন" },
  { id: "7", district_id: "1", name: "Dhaka South City Corporation", bn_name: "ঢাকা দক্ষিণ সিটি কর্পোরেশন" },

  // Gazipur District
  { id: "8", district_id: "2", name: "Gazipur Sadar", bn_name: "গাজীপুর সদর" },
  { id: "9", district_id: "2", name: "Kaliakair", bn_name: "কালিয়াকৈর" },
  { id: "10", district_id: "2", name: "Kaliganj", bn_name: "কালীগঞ্জ" },
  { id: "11", district_id: "2", name: "Kapasia", bn_name: "কাপাসিয়া" },
  { id: "12", district_id: "2", name: "Sreepur", bn_name: "শ্রীপুর" },

  // Narayanganj District
  { id: "13", district_id: "3", name: "Araihazar", bn_name: "আড়াইহাজার" },
  { id: "14", district_id: "3", name: "Bandar", bn_name: "বন্দর" },
  { id: "15", district_id: "3", name: "Narayanganj Sadar", bn_name: "নারায়ণগঞ্জ সদর" },
  { id: "16", district_id: "3", name: "Rupganj", bn_name: "রূপগঞ্জ" },
  { id: "17", district_id: "3", name: "Sonargaon", bn_name: "সোনারগাঁ" },

  // Manikganj District
  { id: "18", district_id: "4", name: "Manikganj Sadar", bn_name: "মানিকগঞ্জ সদর" },
  { id: "19", district_id: "4", name: "Singair", bn_name: "সিংগাইর" },
  { id: "20", district_id: "4", name: "Shivalaya", bn_name: "শিবালয়" },
  { id: "21", district_id: "4", name: "Saturia", bn_name: "সাটুরিয়া" },
  { id: "22", district_id: "4", name: "Harirampur", bn_name: "হরিরামপুর" },

  // Munshiganj District
  { id: "23", district_id: "5", name: "Munshiganj Sadar", bn_name: "মুন্সীগঞ্জ সদর" },
  { id: "24", district_id: "5", name: "Sreenagar", bn_name: "শ্রীনগর" },
  { id: "25", district_id: "5", name: "Sirajdikhan", bn_name: "সিরাজদিখান" },
  { id: "26", district_id: "5", name: "Lohajang", bn_name: "লৌহজং" },
  { id: "27", district_id: "5", name: "Tongibari", bn_name: "টংগিবাড়ী" },

  // Narsingdi District
  { id: "28", district_id: "6", name: "Narsingdi Sadar", bn_name: "নরসিংদী সদর" },
  { id: "29", district_id: "6", name: "Belabo", bn_name: "বেলাবো" },
  { id: "30", district_id: "6", name: "Monohardi", bn_name: "মনোহরদী" },
  { id: "31", district_id: "6", name: "Raipura", bn_name: "রায়পুরা" },
  { id: "32", district_id: "6", name: "Shibpur", bn_name: "শিবপুর" },

  // Tangail District
  { id: "33", district_id: "7", name: "Tangail Sadar", bn_name: "টাঙ্গাইল সদর" },
  { id: "34", district_id: "7", name: "Basail", bn_name: "বাসাইল" },
  { id: "35", district_id: "7", name: "Bhuapur", bn_name: "ভূয়াপুর" },
  { id: "36", district_id: "7", name: "Delduar", bn_name: "দেলদুয়ার" },
  { id: "37", district_id: "7", name: "Ghatail", bn_name: "ঘাটাইল" },
  { id: "38", district_id: "7", name: "Gopalpur", bn_name: "গোপালপুর" },
  { id: "39", district_id: "7", name: "Kalihati", bn_name: "কালিহাতী" },
  { id: "438", district_id: "7", name: "Madhupur", bn_name: "মধুপুর" },
  { id: "439", district_id: "7", name: "Mirzapur", bn_name: "মির্জাপুর" },
  { id: "440", district_id: "7", name: "Nagarpur", bn_name: "নাগরপুর" },
  { id: "441", district_id: "7", name: "Sakhipur", bn_name: "সখিপুর" },
  { id: "442", district_id: "7", name: "Dhanbari", bn_name: "ধনবাড়ী" },

  // Chattogram District
  { id: "40", district_id: "14", name: "Panchlaish", bn_name: "পাঁচলাইশ" },
  { id: "41", district_id: "14", name: "Double Mooring", bn_name: "ডবলমুরিং" },
  { id: "42", district_id: "14", name: "Kotwali", bn_name: "কোতোয়ালী" },
  { id: "43", district_id: "14", name: "Anwara", bn_name: "আনোয়ারা" },
  { id: "44", district_id: "14", name: "Banshkhali", bn_name: "বাঁশখালী" },
  { id: "45", district_id: "14", name: "Boalkhali", bn_name: "বোয়ালখালী" },
  { id: "46", district_id: "14", name: "Chandanaish", bn_name: "চন্দনাইশ" },
  { id: "47", district_id: "14", name: "Fatikchhari", bn_name: "ফটিকছড়ি" },
  { id: "48", district_id: "14", name: "Hathazari", bn_name: "হাটহাজারী" },
  { id: "49", district_id: "14", name: "Mirsharai", bn_name: "মীরসরাই" },
  { id: "50", district_id: "14", name: "Patiya", bn_name: "পটিয়া" },
  { id: "51", district_id: "14", name: "Raozan", bn_name: "রাউজান" },
  { id: "52", district_id: "14", name: "Sandwip", bn_name: "সন্দ্বীপ" },
  { id: "53", district_id: "14", name: "Sitakunda", bn_name: "সীতাকুণ্ড" },

  // Cox's Bazar District
  { id: "54", district_id: "15", name: "Cox's Bazar Sadar", bn_name: "কক্সবাজার সদর" },
  { id: "55", district_id: "15", name: "Chakaria", bn_name: "চকরিয়া" },
  { id: "56", district_id: "15", name: "Maheshkhali", bn_name: "মহেশখালী" },
  { id: "57", district_id: "15", name: "Ramu", bn_name: "রামু" },
  { id: "58", district_id: "15", name: "Teknaf", bn_name: "টেকনাফ" },
  { id: "59", district_id: "15", name: "Ukhiya", bn_name: "উখিয়া" },
  { id: "60", district_id: "15", name: "Kutubdia", bn_name: "কুতুবদিয়া" },

  // Cumilla District
  { id: "61", district_id: "20", name: "Cumilla Sadar", bn_name: "কুমিল্লা সদর" },
  { id: "62", district_id: "20", name: "Barura", bn_name: "বরুড়া" },
  { id: "63", district_id: "20", name: "Chandina", bn_name: "চান্দিনা" },
  { id: "64", district_id: "20", name: "Chauddagram", bn_name: "চৌদ্দগ্রাম" },
  { id: "65", district_id: "20", name: "Daudkandi", bn_name: "দাউদকান্দি" },
  { id: "66", district_id: "20", name: "Debidwar", bn_name: "দেবিদ্বার" },
  { id: "67", district_id: "20", name: "Homna", bn_name: "হোমনা" },
  { id: "68", district_id: "20", name: "Laksam", bn_name: "লাকসাম" },
  { id: "443", district_id: "20", name: "Burichang", bn_name: "বুড়িচং" },
  { id: "444", district_id: "20", name: "Brahmanpara", bn_name: "ব্রাহ্মণপাড়া" },
  { id: "445", district_id: "20", name: "Lalmai", bn_name: "লালমাই" },
  { id: "446", district_id: "20", name: "Monohargonj", bn_name: "মনোহরগঞ্জ" },
  { id: "447", district_id: "20", name: "Meghna", bn_name: "মেঘনা" },
  { id: "448", district_id: "20", name: "Muradnagar", bn_name: "মুরাদনগর" },
  { id: "449", district_id: "20", name: "Nangalkot", bn_name: "নাঙ্গলকোট" },
  { id: "450", district_id: "20", name: "Titas", bn_name: "তিতাস" },

  // Rajshahi District
  { id: "69", district_id: "25", name: "Rajshahi Sadar", bn_name: "রাজশাহী সদর" },
  { id: "70", district_id: "25", name: "Bagha", bn_name: "বাঘা" },
  { id: "71", district_id: "25", name: "Bagmara", bn_name: "বাগমারা" },
  { id: "72", district_id: "25", name: "Charghat", bn_name: "চারঘাট" },
  { id: "73", district_id: "25", name: "Durgapur", bn_name: "দুর্গাপুর" },
  { id: "74", district_id: "25", name: "Godagari", bn_name: "গোদাগাড়ী" },
  { id: "75", district_id: "25", name: "Mohanpur", bn_name: "মোহনপুর" },
  { id: "76", district_id: "25", name: "Paba", bn_name: "পবা" },
  { id: "77", district_id: "25", name: "Puthia", bn_name: "পুঠিয়া" },
  { id: "78", district_id: "25", name: "Tanore", bn_name: "তানোর" },

  // Bogura District
  { id: "79", district_id: "26", name: "Adamdighi", bn_name: "আদমদীঘি" },
  { id: "80", district_id: "26", name: "Bogura Sadar", bn_name: "বগুড়া সদর" },
  { id: "81", district_id: "26", name: "Dhunat", bn_name: "ধুনট" },
  { id: "82", district_id: "26", name: "Dhupchanchia", bn_name: "দুপচাঁচিয়া" },
  { id: "83", district_id: "26", name: "Gabtali", bn_name: "গাবতলী" },
  { id: "84", district_id: "26", name: "Kahaloo", bn_name: "কাহালু" },
  { id: "85", district_id: "26", name: "Nandigram", bn_name: "নন্দীগ্রাম" },
  { id: "86", district_id: "26", name: "Sariakandi", bn_name: "সারিয়াকান্দি" },
  { id: "87", district_id: "26", name: "Sherpur", bn_name: "শেরপুর" },
  { id: "88", district_id: "26", name: "Shajahanpur", bn_name: "শাজাহানপুর" },
  { id: "89", district_id: "26", name: "Sonatala", bn_name: "সোনাতলা" },

  // Sylhet District
  { id: "90", district_id: "49", name: "Sylhet Sadar", bn_name: "সিলেট সদর" },
  { id: "91", district_id: "49", name: "Balaganj", bn_name: "বালাগঞ্জ" },
  { id: "92", district_id: "49", name: "Beanibazar", bn_name: "বিয়ানীবাজার" },
  { id: "93", district_id: "49", name: "Bishwanath", bn_name: "বিশ্বনাথ" },
  { id: "94", district_id: "49", name: "Companiganj", bn_name: "কোম্পানীগঞ্জ" },
  { id: "95", district_id: "49", name: "Fenchuganj", bn_name: "ফেনচুগঞ্জ" },
  { id: "96", district_id: "49", name: "Golapganj", bn_name: "গোলাপগঞ্জ" },
  { id: "97", district_id: "49", name: "Gowainghat", bn_name: "গোয়াইনঘাট" },
  { id: "98", district_id: "49", name: "Jaintiapur", bn_name: "জৈন্তাপুর" },
  { id: "99", district_id: "49", name: "Kanaighat", bn_name: "কানাইঘাট" },

  // Rangpur District
  { id: "100", district_id: "53", name: "Rangpur Sadar", bn_name: "রংপুর সদর" },
  { id: "101", district_id: "53", name: "Badarganj", bn_name: "বদরগঞ্জ" },
  { id: "102", district_id: "53", name: "Gangachara", bn_name: "গঙ্গাচড়া" },
  { id: "103", district_id: "53", name: "Kaunia", bn_name: "কাউনিয়া" },
  { id: "104", district_id: "53", name: "Mithapukur", bn_name: "মিঠাপুকুর" },
  { id: "105", district_id: "53", name: "Pirgachha", bn_name: "পীরগাছা" },
  { id: "106", district_id: "53", name: "Pirganj", bn_name: "পীরগঞ্জ" },
  { id: "107", district_id: "53", name: "Taraganj", bn_name: "তারাগঞ্জ" },

  // Mymensingh District
  { id: "108", district_id: "61", name: "Mymensingh Sadar", bn_name: "ময়মনসিংহ সদর" },
  { id: "109", district_id: "61", name: "Bhaluka", bn_name: "ভালুকা" },
  { id: "110", district_id: "61", name: "Dhobaura", bn_name: "ধোবাউড়া" },
  { id: "111", district_id: "61", name: "Fulbaria", bn_name: "ফুলবাড়িয়া" },
  { id: "112", district_id: "61", name: "Gaffargaon", bn_name: "গফরগাঁও" },
  { id: "113", district_id: "61", name: "Gauripur", bn_name: "গৌরীপুর" },
  { id: "114", district_id: "61", name: "Haluaghat", bn_name: "হালুয়াঘাট" },
  { id: "115", district_id: "61", name: "Ishwargonj", bn_name: "ঈশ্বরগঞ্জ" },
  { id: "116", district_id: "61", name: "Muktagachha", bn_name: "মুক্তাগাছা" },
  { id: "117", district_id: "61", name: "Nandail", bn_name: "নান্দাইল" },
  { id: "118", district_id: "61", name: "Phulpur", bn_name: "ফুলপুর" },
  { id: "119", district_id: "61", name: "Trishal", bn_name: "ত্রিশাল" },

  // Barishal District
  { id: "120", district_id: "43", name: "Barishal Sadar", bn_name: "বরিশাল সদর" },
  { id: "121", district_id: "43", name: "Agailjhara", bn_name: "আগৈলঝাড়া" },
  { id: "122", district_id: "43", name: "Babuganj", bn_name: "বাবুগঞ্জ" },
  { id: "123", district_id: "43", name: "Bakerganj", bn_name: "বাকেরগঞ্জ" },
  { id: "124", district_id: "43", name: "Banaripara", bn_name: "বানারীপাড়া" },
  { id: "125", district_id: "43", name: "Gaurnadi", bn_name: "গৌরনদী" },
  { id: "126", district_id: "43", name: "Hizla", bn_name: "হিজলা" },
  { id: "127", district_id: "43", name: "Mehendiganj", bn_name: "মেহেন্দিগঞ্জ" },
  { id: "128", district_id: "43", name: "Muladi", bn_name: "মুলাদী" },
  { id: "129", district_id: "43", name: "Wazirpur", bn_name: "উজিরপুর" },

  // Khulna District
  { id: "130", district_id: "33", name: "Khulna Sadar", bn_name: "খুলনা সদর" },
  { id: "131", district_id: "33", name: "Batiaghata", bn_name: "বটিয়াঘাটা" },
  { id: "132", district_id: "33", name: "Dacope", bn_name: "দাকোপ" },
  { id: "133", district_id: "33", name: "Dumuria", bn_name: "ডুমুরিয়া" },
  { id: "134", district_id: "33", name: "Dighalia", bn_name: "দিঘলিয়া" },
  { id: "135", district_id: "33", name: "Koyra", bn_name: "কয়রা" },
  { id: "136", district_id: "33", name: "Paikgachha", bn_name: "পাইকগাছা" },
  { id: "137", district_id: "33", name: "Phultala", bn_name: "ফুলতলা" },
  { id: "138", district_id: "33", name: "Rupsha", bn_name: "রূপসা" },
  { id: "139", district_id: "33", name: "Terokhada", bn_name: "তেরখাদা" },

  // Faridpur District
  { id: "140", district_id: "8", name: "Faridpur Sadar", bn_name: "ফরিদপুর সদর" },
  { id: "141", district_id: "8", name: "Alfadanga", bn_name: "আলফাডাঙ্গা" },
  { id: "142", district_id: "8", name: "Bhanga", bn_name: "ভাঙ্গা" },
  { id: "143", district_id: "8", name: "Boalmari", bn_name: "বোয়ালমারী" },
  { id: "144", district_id: "8", name: "Charbhadrasan", bn_name: "চরভদ্রাসন" },

  // Gopalganj District
  { id: "145", district_id: "9", name: "Gopalganj Sadar", bn_name: "গোপালগঞ্জ সদর" },
  { id: "146", district_id: "9", name: "Kashiani", bn_name: "কাশিয়ানী" },
  { id: "147", district_id: "9", name: "Kotalipara", bn_name: "কোটালীপাড়া" },
  { id: "148", district_id: "9", name: "Muksudpur", bn_name: "মুকসুদপুর" },
  { id: "149", district_id: "9", name: "Tungipara", bn_name: "টুঙ্গিপাড়া" },

  // Kishoreganj District
  { id: "150", district_id: "13", name: "Kishoreganj Sadar", bn_name: "কিশোরগঞ্জ সদর" },
  { id: "151", district_id: "13", name: "Austagram", bn_name: "অষ্টগ্রাম" },
  { id: "152", district_id: "13", name: "Bajitpur", bn_name: "বাজিতপুর" },
  { id: "153", district_id: "13", name: "Bhairab", bn_name: "ভৈরব" },
  { id: "154", district_id: "13", name: "Hossainpur", bn_name: "হোসেনপুর" },
  { id: "155", district_id: "13", name: "Itna", bn_name: "ইটনা" },

  // Noakhali District
  { id: "156", district_id: "16", name: "Noakhali Sadar", bn_name: "নোয়াখালী সদর" },
  { id: "157", district_id: "16", name: "Begumganj", bn_name: "বেগমগঞ্জ" },
  { id: "158", district_id: "16", name: "Chatkhil", bn_name: "চাটখিল" },
  { id: "159", district_id: "16", name: "Companiganj", bn_name: "কোম্পানীগঞ্জ" },
  { id: "160", district_id: "16", name: "Hatiya", bn_name: "হাতিয়া" },
  { id: "161", district_id: "16", name: "Senbagh", bn_name: "সেনবাগ" },

  // Feni District
  { id: "162", district_id: "17", name: "Feni Sadar", bn_name: "ফেনী সদর" },
  { id: "163", district_id: "17", name: "Chhagalnaiya", bn_name: "ছাগলনাইয়া" },
  { id: "164", district_id: "17", name: "Daganbhuiyan", bn_name: "দাগনভূঞা" },
  { id: "165", district_id: "17", name: "Parshuram", bn_name: "পরশুরাম" },
  { id: "166", district_id: "17", name: "Sonagazi", bn_name: "সোনাগাজী" },

  // Brahmanbaria District
  { id: "167", district_id: "21", name: "Brahmanbaria Sadar", bn_name: "ব্রাহ্মণবাড়িয়া সদর" },
  { id: "168", district_id: "21", name: "Akhaura", bn_name: "আখাউড়া" },
  { id: "169", district_id: "21", name: "Ashuganj", bn_name: "আশুগঞ্জ" },
  { id: "170", district_id: "21", name: "Bancharampur", bn_name: "বাঞ্ছারামপুর" },
  { id: "171", district_id: "21", name: "Kasba", bn_name: "কসবা" },
  { id: "172", district_id: "21", name: "Nasirnagar", bn_name: "নাসিরনগর" },

  // Naogaon District
  { id: "173", district_id: "29", name: "Naogaon Sadar", bn_name: "নওগাঁ সদর" },
  { id: "174", district_id: "29", name: "Atrai", bn_name: "আত্রাই" },
  { id: "175", district_id: "29", name: "Badalgachhi", bn_name: "বদলগাছি" },
  { id: "176", district_id: "29", name: "Manda", bn_name: "মান্দা" },
  { id: "177", district_id: "29", name: "Mohadevpur", bn_name: "মহাদেবপুর" },
  { id: "178", district_id: "29", name: "Patnitala", bn_name: "পত্নীতলা" },

  // Natore District
  { id: "179", district_id: "30", name: "Natore Sadar", bn_name: "নাটোর সদর" },
  { id: "180", district_id: "30", name: "Bagatipara", bn_name: "বাগাতিপাড়া" },
  { id: "181", district_id: "30", name: "Baraigram", bn_name: "বড়াইগ্রাম" },
  { id: "182", district_id: "30", name: "Gurudaspur", bn_name: "গুরুদাসপুর" },
  { id: "183", district_id: "30", name: "Lalpur", bn_name: "লালপুর" },
  { id: "184", district_id: "30", name: "Singra", bn_name: "সিংড়া" },

  // Sirajganj District
  { id: "185", district_id: "32", name: "Sirajganj Sadar", bn_name: "সিরাজগঞ্জ সদর" },
  { id: "186", district_id: "32", name: "Belkuchi", bn_name: "বেলকুচি" },
  { id: "187", district_id: "32", name: "Kamarkhanda", bn_name: "কামারখন্দ" },
  { id: "188", district_id: "32", name: "Kazipur", bn_name: "কাজীপুর" },
  { id: "189", district_id: "32", name: "Raiganj", bn_name: "রায়গঞ্জ" },
  { id: "190", district_id: "32", name: "Shahjadpur", bn_name: "শাহজাদপুর" },
  { id: "191", district_id: "32", name: "Ullahpara", bn_name: "উল্লাপাড়া" },

  // Jashore District
  { id: "192", district_id: "36", name: "Jashore Sadar", bn_name: "যশোর সদর" },
  { id: "193", district_id: "36", name: "Abhaynagar", bn_name: "অভয়নগর" },
  { id: "194", district_id: "36", name: "Bagherpara", bn_name: "বাঘারপাড়া" },
  { id: "195", district_id: "36", name: "Chaugachha", bn_name: "চৌগাছা" },
  { id: "196", district_id: "36", name: "Jhikargachha", bn_name: "ঝিকরগাছা" },
  { id: "197", district_id: "36", name: "Keshabpur", bn_name: "কেশবপুর" },
  { id: "198", district_id: "36", name: "Manirampur", bn_name: "মণিরামপুর" },
  { id: "199", district_id: "36", name: "Sharsha", bn_name: "শার্শা" },

  // Kushtia District
  { id: "200", district_id: "39", name: "Kushtia Sadar", bn_name: "কুষ্টিয়া সদর" },
  { id: "201", district_id: "39", name: "Bheramara", bn_name: "ভেড়ামারা" },
  { id: "202", district_id: "39", name: "Daulatpur", bn_name: "দৌলতপুর" },
  { id: "203", district_id: "39", name: "Khoksa", bn_name: "খোকসা" },
  { id: "204", district_id: "39", name: "Kumarkhali", bn_name: "কুমারখালী" },
  { id: "205", district_id: "39", name: "Mirpur", bn_name: "মিরপুর" },

  // Patuakhali District
  { id: "206", district_id: "44", name: "Patuakhali Sadar", bn_name: "পটুয়াখালী সদর" },
  { id: "207", district_id: "44", name: "Bauphal", bn_name: "বাউফল" },
  { id: "208", district_id: "44", name: "Dashmina", bn_name: "দশমিনা" },
  { id: "209", district_id: "44", name: "Galachipa", bn_name: "গলাচিপা" },
  { id: "210", district_id: "44", name: "Kalapara", bn_name: "কলাপাড়া" },
  { id: "211", district_id: "44", name: "Mirzaganj", bn_name: "মির্জাগঞ্জ" },

  // Bhola District
  { id: "212", district_id: "45", name: "Bhola Sadar", bn_name: "ভোলা সদর" },
  { id: "213", district_id: "45", name: "Burhanuddin", bn_name: "বোরহানউদ্দিন" },
  { id: "214", district_id: "45", name: "Char Fasson", bn_name: "চর ফ্যাশন" },
  { id: "215", district_id: "45", name: "Daulatkhan", bn_name: "দৌলতখান" },
  { id: "216", district_id: "45", name: "Lalmohan", bn_name: "লালমোহন" },
  { id: "217", district_id: "45", name: "Manpura", bn_name: "মনপুরা" },
  { id: "218", district_id: "45", name: "Tazumuddin", bn_name: "তজুমদ্দিন" },

  // Moulvibazar District
  { id: "219", district_id: "50", name: "Moulvibazar Sadar", bn_name: "মৌলভীবাজার সদর" },
  { id: "220", district_id: "50", name: "Barlekha", bn_name: "বড়লেখা" },
  { id: "221", district_id: "50", name: "Juri", bn_name: "জুড়ী" },
  { id: "222", district_id: "50", name: "Kamalganj", bn_name: "কমলগঞ্জ" },
  { id: "223", district_id: "50", name: "Kulaura", bn_name: "কুলাউড়া" },
  { id: "224", district_id: "50", name: "Rajnagar", bn_name: "রাজনগর" },
  { id: "225", district_id: "50", name: "Sreemangal", bn_name: "শ্রীমঙ্গল" },

  // Dinajpur District
  { id: "226", district_id: "58", name: "Dinajpur Sadar", bn_name: "দিনাজপুর সদর" },
  { id: "227", district_id: "58", name: "Birampur", bn_name: "বিরামপুর" },
  { id: "228", district_id: "58", name: "Birganj", bn_name: "বীরগঞ্জ" },
  { id: "229", district_id: "58", name: "Biral", bn_name: "বিরল" },
  { id: "230", district_id: "58", name: "Bochaganj", bn_name: "বোচাগঞ্জ" },
  { id: "231", district_id: "58", name: "Chirirbandar", bn_name: "চিরিরবন্দর" },
  { id: "232", district_id: "58", name: "Phulbari", bn_name: "ফুলবাড়ী" },
  { id: "233", district_id: "58", name: "Ghoraghat", bn_name: "ঘোড়াঘাট" },
  { id: "234", district_id: "58", name: "Hakimpur", bn_name: "হাকিমপুর" },
  { id: "235", district_id: "58", name: "Kaharole", bn_name: "কাহারোল" },
  { id: "236", district_id: "58", name: "Khansama", bn_name: "খানসামা" },
  { id: "237", district_id: "58", name: "Nawabganj", bn_name: "নবাবগঞ্জ" },
  { id: "238", district_id: "58", name: "Parbatipur", bn_name: "পার্বতীপুর" },

  // Joypurhat District
  { id: "239", district_id: "28", name: "Joypurhat Sadar", bn_name: "জয়পুরহাট সদর" },
  { id: "240", district_id: "28", name: "Akkelpur", bn_name: "আক্কেলপুর" },
  { id: "241", district_id: "28", name: "Kalai", bn_name: "কালাই" },
  { id: "242", district_id: "28", name: "Khetlal", bn_name: "ক্ষেতলাল" },
  { id: "243", district_id: "28", name: "Panchbibi", bn_name: "পাঁচবিবি" },

  // Chapai Nawabganj District
  { id: "244", district_id: "31", name: "Chapai Nawabganj Sadar", bn_name: "চাঁপাইনবাবগঞ্জ সদর" },
  { id: "245", district_id: "31", name: "Bholahat", bn_name: "ভোলাহাট" },
  { id: "246", district_id: "31", name: "Gomastapur", bn_name: "গোমস্তাপুর" },
  { id: "247", district_id: "31", name: "Nachole", bn_name: "নাচোল" },
  { id: "248", district_id: "31", name: "Shibganj", bn_name: "শিবগঞ্জ" },

  // Bagherhat District
  { id: "249", district_id: "34", name: "Bagerhat Sadar", bn_name: "বাগেরহাট সদর" },
  { id: "250", district_id: "34", name: "Chitalmari", bn_name: "চিতলমারী" },
  { id: "251", district_id: "34", name: "Fakirhat", bn_name: "ফকিরহাট" },
  { id: "252", district_id: "34", name: "Kachua", bn_name: "কচুয়া" },
  { id: "253", district_id: "34", name: "Mollahat", bn_name: "মোল্লাহাট" },
  { id: "254", district_id: "34", name: "Mongla", bn_name: "মোংলা" },
  { id: "255", district_id: "34", name: "Morrelganj", bn_name: "মোড়েলগঞ্জ" },
  { id: "256", district_id: "34", name: "Rampal", bn_name: "রামপাল" },
  { id: "257", district_id: "34", name: "Sarankhola", bn_name: "শরণখোলা" },

  // Satkhira District
  { id: "258", district_id: "35", name: "Satkhira Sadar", bn_name: "সাতক্ষীরা সদর" },
  { id: "259", district_id: "35", name: "Assasuni", bn_name: "আশাশুনি" },
  { id: "260", district_id: "35", name: "Debhata", bn_name: "দেবহাটা" },
  { id: "261", district_id: "35", name: "Kalaroa", bn_name: "কলারোয়া" },
  { id: "262", district_id: "35", name: "Kaliganj", bn_name: "কালীগঞ্জ" },
  { id: "263", district_id: "35", name: "Shyamnagar", bn_name: "শ্যামনগর" },
  { id: "264", district_id: "35", name: "Tala", bn_name: "তালা" },

  // Jhenaidah District
  { id: "265", district_id: "42", name: "Jhenaidah Sadar", bn_name: "ঝিনাইদহ সদর" },
  { id: "266", district_id: "42", name: "Harinakundu", bn_name: "হরিণাকুণ্ডু" },
  { id: "267", district_id: "42", name: "Kaliganj", bn_name: "কালীগঞ্জ" },
  { id: "268", district_id: "42", name: "Kotchandpur", bn_name: "কোটচাঁদপুর" },
  { id: "269", district_id: "42", name: "Maheshpur", bn_name: "মহেশপুর" },
  { id: "270", district_id: "42", name: "Shailkupa", bn_name: "শৈলকুপা" },

  // Pirojpur District
  { id: "271", district_id: "46", name: "Pirojpur Sadar", bn_name: "পিরোজপুর সদর" },
  { id: "272", district_id: "46", name: "Bhandaria", bn_name: "ভাণ্ডারিয়া" },
  { id: "273", district_id: "46", name: "Kawkhali", bn_name: "কাউখালী" },
  { id: "274", district_id: "46", name: "Mathbaria", bn_name: "মঠবাড়িয়া" },
  { id: "275", district_id: "46", name: "Nazirpur", bn_name: "নাজিরপুর" },
  { id: "276", district_id: "46", name: "Nesarabad (Swarupkati)", bn_name: "নেছারাবাদ (স্বরূপকাঠি)" },
  { id: "277", district_id: "46", name: "Indurkani", bn_name: "ইন্দুরকানী" },

  // Barguna District
  { id: "278", district_id: "47", name: "Barguna Sadar", bn_name: "বরগুনা সদর" },
  { id: "279", district_id: "47", name: "Amtali", bn_name: "আমতলী" },
  { id: "280", district_id: "47", name: "Bamna", bn_name: "বামনা" },
  { id: "281", district_id: "47", name: "Betagi", bn_name: "বেতাগী" },
  { id: "282", district_id: "47", name: "Patharghata", bn_name: "পাথরঘাটা" },
  { id: "283", district_id: "47", name: "Taltali", bn_name: "তালতলী" },

  // Habiganj District
  { id: "284", district_id: "51", name: "Habiganj Sadar", bn_name: "হবিগঞ্জ সদর" },
  { id: "285", district_id: "51", name: "Ajmiriganj", bn_name: "আজমিরীগঞ্জ" },
  { id: "286", district_id: "51", name: "Bahubal", bn_name: "বাহুবল" },
  { id: "287", district_id: "51", name: "Baniyachong", bn_name: "বানিয়াচং" },
  { id: "288", district_id: "51", name: "Chunarughat", bn_name: "চুনারুঘাট" },
  { id: "289", district_id: "51", name: "Lakhai", bn_name: "লাখাই" },
  { id: "290", district_id: "51", name: "Madhabpur", bn_name: "মাধবপুর" },
  { id: "291", district_id: "51", name: "Nabiganj", bn_name: "নবীগঞ্জ" },

  // Sunamganj District
  { id: "292", district_id: "52", name: "Sunamganj Sadar", bn_name: "সুনামগঞ্জ সদর" },
  { id: "293", district_id: "52", name: "Bishwamirpur", bn_name: "বিশ্বম্ভরপুর" },
  { id: "294", district_id: "52", name: "Chhatak", bn_name: "ছাতক" },
  { id: "295", district_id: "52", name: "Derai", bn_name: "দিরাই" },
  { id: "296", district_id: "52", name: "Dharampasha", bn_name: "ধর্মপাশা" },
  { id: "297", district_id: "52", name: "Dowarabazar", bn_name: "দোয়ারাবাজার" },
  { id: "298", district_id: "52", name: "Jagannathpur", bn_name: "জগন্নাথপুর" },
  { id: "299", district_id: "52", name: "Jamalganj", bn_name: "জামালগঞ্জ" },
  { id: "300", district_id: "52", name: "Sullah", bn_name: "শাল্লা" },
  { id: "301", district_id: "52", name: "Tahirpur", bn_name: "তাহিরপুর" },

  // Nilphamari District
  { id: "302", district_id: "55", name: "Nilphamari Sadar", bn_name: "নীলফামারী সদর" },
  { id: "303", district_id: "55", name: "Dimla", bn_name: "ডিমলা" },
  { id: "304", district_id: "55", name: "Domar", bn_name: "ডোমার" },
  { id: "305", district_id: "55", name: "Jaldhaka", bn_name: "জলঢাকা" },
  { id: "306", district_id: "55", name: "Kishoreganj", bn_name: "কিশোরগঞ্জ" },
  { id: "307", district_id: "55", name: "Saidpur", bn_name: "সৈয়দপুর" },

  // Kurigram District
  { id: "308", district_id: "56", name: "Kurigram Sadar", bn_name: "কুড়িগ্রাম সদর" },
  { id: "309", district_id: "56", name: "Bhurungamari", bn_name: "ভুরুঙ্গামারী" },
  { id: "310", district_id: "56", name: "Chilmari", bn_name: "চিলমারী" },
  { id: "311", district_id: "56", name: "Phulbari", bn_name: "ফুলবাড়ী" },
  { id: "312", district_id: "56", name: "Nageshwari", bn_name: "নাগেশ্বরী" },
  { id: "313", district_id: "56", name: "Rajarhat", bn_name: "রাজারহাট" },
  { id: "314", district_id: "56", name: "Ulipur", bn_name: "উলিপুর" },

  // Dinajpur (already done partially but adding rest)
  { id: "315", district_id: "58", name: "Fulbari", bn_name: "ফুলবাড়ী" },

  // Jamalpur District
  { id: "316", district_id: "62", name: "Jamalpur Sadar", bn_name: "জামালপুর সদর" },
  { id: "317", district_id: "62", name: "Bakshiganj", bn_name: "বকশীগঞ্জ" },
  { id: "318", district_id: "62", name: "Dewanganj", bn_name: "দেওয়ানগঞ্জ" },
  { id: "319", district_id: "62", name: "Islampur", bn_name: "ইসলামপুর" },
  { id: "320", district_id: "62", name: "Madarganj", bn_name: "মাদারগঞ্জ" },
  { id: "321", district_id: "62", name: "Melandaha", bn_name: "মেলান্দহ" },
  { id: "322", district_id: "62", name: "Sarishabari", bn_name: "সরিষাবাড়ী" },

  // Netrokona District
  { id: "323", district_id: "63", name: "Netrokona Sadar", bn_name: "নেত্রকোণা সদর" },
  { id: "324", district_id: "63", name: "Atpara", bn_name: "আটপাড়া" },
  { id: "325", district_id: "63", name: "Barhatta", bn_name: "বারহাট্টা" },
  { id: "326", district_id: "63", name: "Durgapur", bn_name: "দুর্গাপুর" },
  { id: "327", district_id: "63", name: "Khaliajuri", bn_name: "খালিয়াজুরী" },
  { id: "328", district_id: "63", name: "Kalmakanda", bn_name: "কলমাকান্দা" },
  { id: "329", district_id: "63", name: "Kendua", bn_name: "কেন্দুয়া" },
  { id: "330", district_id: "63", name: "Madan", bn_name: "মদন" },
  { id: "331", district_id: "63", name: "Mohanganj", bn_name: "মোহনগঞ্জ" },
  { id: "332", district_id: "63", name: "Purbadhala", bn_name: "পূর্বধলা" },

  // Sherpur District
  { id: "333", district_id: "64", name: "Sherpur Sadar", bn_name: "শেরপুর সদর" },
  { id: "334", district_id: "64", name: "Jhenaigati", bn_name: "ঝিনাইগাতী" },
  { id: "335", district_id: "64", name: "Nakla", bn_name: "নকলা" },
  { id: "336", district_id: "64", name: "Nolitabari", bn_name: "নালিতাবাড়ী" },
  { id: "337", district_id: "64", name: "Sreebordi", bn_name: "শ্রীবরদী" },

  // Gaibandha District
  { id: "338", district_id: "54", name: "Gaibandha Sadar", bn_name: "গাইবান্ধা সদর" },
  { id: "339", district_id: "54", name: "Phulchhari", bn_name: "ফুলছড়ি" },
  { id: "340", district_id: "54", name: "Gobindaganj", bn_name: "গোবিন্দগঞ্জ" },
  { id: "341", district_id: "54", name: "Palashbari", bn_name: "পলাশবাড়ী" },
  { id: "342", district_id: "54", name: "Sadullapur", bn_name: "সাদুল্লাপুর" },
  { id: "343", district_id: "54", name: "Saghata", bn_name: "সাঘাটা" },
  { id: "344", district_id: "54", name: "Sundarganj", bn_name: "সুন্দরগঞ্জ" },

  // Magura District
  { id: "345", district_id: "37", name: "Magura Sadar", bn_name: "মাগুরা সদর" },
  { id: "346", district_id: "37", name: "Mohammadpur", bn_name: "মোহম্মদপুর" },
  { id: "347", district_id: "37", name: "Shalikha", bn_name: "শালিখা" },
  { id: "348", district_id: "37", name: "Sreepur", bn_name: "শ্রীপুর" },

  // Narail District
  { id: "349", district_id: "38", name: "Narail Sadar", bn_name: "নড়াইল সদর" },
  { id: "350", district_id: "38", name: "Kaliara", bn_name: "কালিয়া" },
  { id: "351", district_id: "38", name: "Lohagara", bn_name: "লোহাগড়া" },

  // Chuadanga District
  { id: "352", district_id: "40", name: "Chuadanga Sadar", bn_name: "চুয়াডাঙ্গা সদর" },
  { id: "353", district_id: "40", name: "Alamdanga", bn_name: "আলমডাঙ্গা" },
  { id: "354", district_id: "40", name: "Damurhuda", bn_name: "দামুড়হুদা" },
  { id: "355", district_id: "40", name: "Jiban Nagar", bn_name: "জীবননগর" },

  // Meherpur District
  { id: "356", district_id: "41", name: "Meherpur Sadar", bn_name: "মেহেরপুর সদর" },
  { id: "357", district_id: "41", name: "Gangni", bn_name: "গাংনী" },
  { id: "358", district_id: "41", name: "Mujibnagar", bn_name: "মুজিবনগর" },

  // Jhalokati District
  { id: "359", district_id: "48", name: "Jhalokati Sadar", bn_name: "ঝালকাঠি সদর" },
  { id: "360", district_id: "48", name: "Kathalia", bn_name: "কাঠালিয়া" },
  { id: "361", district_id: "48", name: "Nalchiti", bn_name: "নলছিটি" },
  { id: "362", district_id: "48", name: "Rajapur", bn_name: "রাজাপুর" },

  // Lalmonirhat District
  { id: "363", district_id: "57", name: "Lalmonirhat Sadar", bn_name: "লালমনিরহাট সদর" },
  { id: "364", district_id: "57", name: "Aditmari", bn_name: "আদিতমারী" },
  { id: "365", district_id: "57", name: "Hatibandha", bn_name: "হাতীবান্ধা" },
  { id: "366", district_id: "57", name: "Kaliganj", bn_name: "কালীগঞ্জ" },
  { id: "367", district_id: "57", name: "Patgram", bn_name: "পাটগ্রাম" },

  // Thakurgaon District
  { id: "368", district_id: "59", name: "Thakurgaon Sadar", bn_name: "ঠাকুরগাঁও সদর" },
  { id: "369", district_id: "59", name: "Baliadangi", bn_name: "বালিয়াডাঙ্গী" },
  { id: "370", district_id: "59", name: "Haripur", bn_name: "হরিপুর" },
  { id: "371", district_id: "59", name: "Pirganj", bn_name: "পীরগঞ্জ" },
  { id: "372", district_id: "59", name: "Ranisankail", bn_name: "রাণীশংকৈল" },

  // Panchagarh District
  { id: "373", district_id: "60", name: "Panchagarh Sadar", bn_name: "পঞ্চগড় সদর" },
  { id: "374", district_id: "60", name: "Atwari", bn_name: "আটোয়ারী" },
  { id: "375", district_id: "60", name: "Boda", bn_name: "বোদা" },
  { id: "376", district_id: "60", name: "Debiganj", bn_name: "দেবীগঞ্জ" },
  { id: "377", district_id: "60", name: "Tetulia", bn_name: "তেতুলিয়া" },

  // Khagrachhari District
  { id: "378", district_id: "22", name: "Khagrachhari Sadar", bn_name: "খাগড়াছড়ি সদর" },
  { id: "379", district_id: "22", name: "Dighinala", bn_name: "দীঘিনালা" },
  { id: "380", district_id: "22", name: "Lakshmichhari", bn_name: "লক্ষ্মীছড়ি" },
  { id: "381", district_id: "22", name: "Mahalchhari", bn_name: "মহালছড়ি" },
  { id: "382", district_id: "22", name: "Manikchhari", bn_name: "মানিকছড়ি" },
  { id: "383", district_id: "22", name: "Matiranga", bn_name: "মাটিরাঙ্গা" },
  { id: "384", district_id: "22", name: "Panchhari", bn_name: "পানছড়ি" },
  { id: "385", district_id: "22", name: "Ramgarh", bn_name: "রামগড়" },

  // Rangamati District
  { id: "386", district_id: "23", name: "Rangamati Sadar", bn_name: "রাঙ্গামাটি সদর" },
  { id: "387", district_id: "23", name: "Bagaichhari", bn_name: "বাঘাইছড়ি" },
  { id: "388", district_id: "23", name: "Barkal", bn_name: "বরকল" },
  { id: "389", district_id: "23", name: "Kawkhali", bn_name: "কাউখালী" },
  { id: "390", district_id: "23", name: "Kaptai", bn_name: "কাপ্তাই" },
  { id: "391", district_id: "23", name: "Langadu", bn_name: "লংগদু" },
  { id: "392", district_id: "23", name: "Naniyachar", bn_name: "নানিয়ারচর" },
  { id: "393", district_id: "23", name: "Rajasthali", bn_name: "রাজস্থলী" },

  // Bandarban District
  { id: "394", district_id: "24", name: "Bandarban Sadar", bn_name: "বান্দরবান সদর" },
  { id: "395", district_id: "24", name: "Alikadam", bn_name: "আলীকদম" },
  { id: "396", district_id: "24", name: "Lama", bn_name: "লামা" },
  { id: "397", district_id: "24", name: "Naikhongchhari", bn_name: "নাইক্ষ্যংছড়ি" },
  { id: "398", district_id: "24", name: "Rowangchhari", bn_name: "রোয়াংছড়ি" },
  { id: "399", district_id: "24", name: "Ruma", bn_name: "রুমা" },
  { id: "400", district_id: "24", name: "Thanchi", bn_name: "থানচি" },

  // Madaripur District
  { id: "401", district_id: "10", name: "Madaripur Sadar", bn_name: "মাদারীপুর সদর" },
  { id: "402", district_id: "10", name: "Kalkini", bn_name: "কালকিনি" },
  { id: "403", district_id: "10", name: "Rajoir", bn_name: "রাজৈর" },
  { id: "404", district_id: "10", name: "Shibchar", bn_name: "শিবচর" },

  // Rajbari District
  { id: "405", district_id: "11", name: "Rajbari Sadar", bn_name: "রাজবাড়ী সদর" },
  { id: "406", district_id: "11", name: "Baliakandi", bn_name: "বালিয়াকান্দি" },
  { id: "407", district_id: "11", name: "Goalandaghat", bn_name: "গোয়ালন্দঘাট" },
  { id: "408", district_id: "11", name: "Pangsha", bn_name: "পাংশা" },
  { id: "409", district_id: "11", name: "Kalukhali", bn_name: "কালুখালী" },

  // Shariatpur District
  { id: "410", district_id: "12", name: "Shariatpur Sadar", bn_name: "শরীয়তপুর সদর" },
  { id: "411", district_id: "12", name: "Bhedarganj", bn_name: "ভেদরগঞ্জ" },
  { id: "412", district_id: "12", name: "Damudya", bn_name: "ডামুড্যা" },
  { id: "413", district_id: "12", name: "Gosairhat", bn_name: "গোসাইরহাট" },
  { id: "414", district_id: "12", name: "Naria", bn_name: "নড়িয়া" },
  { id: "415", district_id: "12", name: "Zanjira", bn_name: "জাজিরা" },

  // Lakshmipur District
  { id: "416", district_id: "18", name: "Lakshmipur Sadar", bn_name: "লক্ষ্মীপুর সদর" },
  { id: "417", district_id: "18", name: "Raipur", bn_name: "রায়পুর" },
  { id: "418", district_id: "18", name: "Ramganj", bn_name: "রামগঞ্জ" },
  { id: "419", district_id: "18", name: "Ramgati", bn_name: "রামগতি" },
  { id: "420", district_id: "18", name: "Kamalnagar", bn_name: "কমলনগর" },

  // Chandpur District
  { id: "421", district_id: "19", name: "Chandpur Sadar", bn_name: "চাঁদপুর সদর" },
  { id: "422", district_id: "19", name: "Faridganj", bn_name: "ফরিদগঞ্জ" },
  { id: "423", district_id: "19", name: "Hajiganj", bn_name: "হাজীগঞ্জ" },
  { id: "424", district_id: "19", name: "Haymchar", bn_name: "হাইমচর" },
  { id: "425", district_id: "19", name: "Kachua", bn_name: "কচুয়া" },
  { id: "426", district_id: "19", name: "Matlab North", bn_name: "মতলব উত্তর" },
  { id: "427", district_id: "19", name: "Matlab South", bn_name: "মতলব দক্ষিণ" },
  { id: "428", district_id: "19", name: "Shahrasti", bn_name: "শাহরাস্তি" },

  // Pabna District
  { id: "429", district_id: "27", name: "Pabna Sadar", bn_name: "পাবনা সদর" },
  { id: "430", district_id: "27", name: "Atgharia", bn_name: "আটঘরিয়া" },
  { id: "431", district_id: "27", name: "Bera", bn_name: "বেড়া" },
  { id: "432", district_id: "27", name: "Bhangura", bn_name: "ভাঙ্গুড়া" },
  { id: "433", district_id: "27", name: "Chatmohar", bn_name: "চাটমোহর" },
  { id: "434", district_id: "27", name: "Faridpur", bn_name: "ফরিদপুর" },
  { id: "435", district_id: "27", name: "Ishwardi", bn_name: "ঈশ্বরদী" },
  { id: "436", district_id: "27", name: "Santhia", bn_name: "সাথিয়া" },
  { id: "437", district_id: "27", name: "Sujanagar", bn_name: "সুজানগর" },
];
