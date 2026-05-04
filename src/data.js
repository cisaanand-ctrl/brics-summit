// Delegates are loaded live from Google Sheets.
// This file only contains static reference data that never changes.

export const DELEGATIONS = [
  { id:1,  country:"Brazil",       sai:"Federal Court of Accounts (TCU)",              liaison:"Mr. Rajeevan K, SAO",          support:"Mr. Sashi Kumar, AAO",        flag:"🇧🇷" },
  { id:2,  country:"China",        sai:"National Audit Office of China",               liaison:"Mr. Lingaraj Naik S, Director", support:"Mr. Akash Singh, AAO",         flag:"🇨🇳" },
  { id:3,  country:"Egypt",        sai:"SAI Egypt",                                    liaison:"Mr. Arun Kumar VM, Director",   support:"Mr. Satish KP, AAO",           flag:"🇪🇬" },
  { id:4,  country:"Ethiopia",     sai:"Office of the Federal Auditor General",        liaison:"Mr. Om Kumar Adlak, SAO",       support:"Ms. Bindu KS, AAO",            flag:"🇪🇹" },
  { id:5,  country:"Indonesia",    sai:"Audit Board of Indonesia (BPK)",               liaison:"Mr. Bipin PS, SAO",             support:"Mr. Bhaktiyar Siddiq, AAO",    flag:"🇮🇩" },
  { id:6,  country:"Russia",       sai:"Accounts Chamber of the Russian Federation",   liaison:"Mr. Sourav Ramesh, Dy. Director",support:"Ms. Nandini Srivatsa, AAO",  flag:"🇷🇺" },
  { id:7,  country:"South Africa", sai:"Auditor-General South Africa (AGSA)",          liaison:"Mr. Pankaj Sharma, SAO",        support:"Mr. Jaswant Mourya, AAO",      flag:"🇿🇦" },
  { id:8,  country:"UAE",          sai:"UAE Accountability Authority",                 liaison:"Mr. Arun Samuel",               support:"Mr. Lakhan Singh, AAO",        flag:"🇦🇪" },
  { id:9,  country:"Iran",         sai:"SAI Iran",                                     liaison:"Mr. Darshan M R",               support:"Mr. Deeraj Posina, AAO",       flag:"🇮🇷" },
  { id:10, country:"India",        sai:"Comptroller & Auditor General of India",       liaison:"—",                             support:"—",                            flag:"🇮🇳" },
];

export const AGENDA = {
  "6 May 2026": [
    { time:"All day",      item:"Arrival of Delegates – The Leela Palace Bengaluru",                                          type:"arrival" },
    { time:"15:30–18:30",  item:"Social Programme – Visit to Bengaluru Palace",                                               type:"social",       resp:"SAI India" },
  ],
  "7 May 2026": [
    { time:"09:30–09:40",  item:"Inaugural address by C&AG of India – Mr. K. Sanjay Murthy",                                 type:"session" },
    { time:"09:40–10:25",  item:"Opening address by each Head of SAI/Delegation (5-min slots each)",                         type:"session",      resp:"All SAIs" },
    { time:"10:25–11:00",  item:"Keynote Address + Q&A",                                                                     type:"keynote",      resp:"Dr. O P Agarwal, Distinguished Fellow, NITI Aayog" },
    { time:"11:00–11:45",  item:"Group Photo and Tea Break",                                                                  type:"break" },
    { time:"11:45–12:15",  item:"SAI Brazil – 'Efficiency in Public Investments: Auditing Urban Mobility via Five Case Model'", type:"presentation", resp:"Mr. Maurício Ramos Jacintho de Almeida" },
    { time:"12:15–12:45",  item:"SAI China – 'Xiong'an New Area: A City of the Future Redefining Urban Mobility'",           type:"presentation", resp:"Mr. HOU Kai, Auditor General" },
    { time:"12:45–13:15",  item:"SAI Egypt – 'Role of SAIs in Environmental Governance of Urban Expansion'",                 type:"presentation", resp:"Ms. Mona Fahmi & Mr. Kareem Ismail" },
    { time:"13:15–14:15",  item:"Lunch Break",                                                                               type:"break" },
    { time:"14:15–14:45",  item:"SAI Ethiopia – Presentation + Q&A",                                                        type:"presentation", resp:"SAI Ethiopia" },
    { time:"14:45–15:15",  item:"SAI Indonesia – Presentation + Q&A",                                                       type:"presentation", resp:"SAI Indonesia" },
    { time:"15:15–16:00",  item:"Tea Break",                                                                                 type:"break" },
    { time:"16:00–17:00",  item:"Keynote Address – Shailendra Kaushik, Director & Co-founder, Cities Forum",                 type:"keynote" },
    { time:"19:30 onwards",item:"Dinner hosted by C&AG of India",                                                            type:"social",       resp:"SAI India" },
  ],
  "8 May 2026": [
    { time:"09:30–10:00",  item:"SAI Russia – Presentation + Q&A",                                                          type:"presentation", resp:"SAI Russia" },
    { time:"10:00–10:30",  item:"SAI South Africa – Presentation + Q&A",                                                    type:"presentation", resp:"SAI South Africa" },
    { time:"10:30–11:00",  item:"SAI UAE – Presentation + Q&A",                                                             type:"presentation", resp:"SAI UAE" },
    { time:"11:00–11:30",  item:"Tea Break",                                                                                 type:"break" },
    { time:"11:30–12:30",  item:"Open Discussion / Rapporteur's Presentation",                                               type:"session" },
    { time:"12:30–13:00",  item:"Adoption of Bengaluru Declaration",                                                         type:"session" },
    { time:"13:00–14:00",  item:"Lunch Break",                                                                               type:"break" },
    { time:"14:00–16:00",  item:"Field Visit – IISc Bangalore / City Tour",                                                  type:"social",       resp:"SAI India" },
    { time:"Evening",      item:"SAI Heads Dinner – The Leela Palace",                                                       type:"social",       resp:"SAI India" },
  ],
};

export const COMMITTEES = [
  { name:"Summit Coordination",           head:"Yamini T M",    members:["Ramalakshmi SAO","Pankaj Sharma SAO","Meera S SAO","Sobha Varrior SAO","Anil Prabhakar AAO"] },
  { name:"Airport Protocol & Facilitation",head:"Matthews Mathew",members:["Ramesh SAO","Mani Kumar SAO","Jalaluddin SAO"] },
  { name:"Transport & Logistics",          head:"Matthews Mathew",members:["Kishor Thakur SAO","Bala S SAO","Shashi Kumar AAO"] },
  { name:"Accommodation & Hotel Helpdesk", head:"Vijaykumar J",  members:["Mallikeshwai SAO","Girijesh VP SAO","Nihar Paul SAO"] },
  { name:"Social Visits & External Engagement",head:"Vijaykumar J",members:["Neeraja Tagat SAO","Gangappa SAO","Shashi Kumar Sharma SAO"] },
  { name:"Medical & Liaisoning",           head:"Yamini T M",    members:["Raghavendra SAO","Darshan M R SAO","Murali Kumar P SAO"] },
  { name:"IT & AV Coordination",           head:"Yamini T M",    members:["JJS Anand SAO","Girjesh AAO","Sunil Thonse Sr Ar","Himanshu Sr Ar"] },
];
