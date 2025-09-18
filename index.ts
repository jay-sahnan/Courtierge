import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import inquirer from 'inquirer';
import { z } from 'zod';

async function loginToSite(page: any, email: string, password: string): Promise<void> {
  console.log("🔐 Logging in...");
  
  // Step 1: Click the Login Button
  await page.act("Click the Login button");
  // Step 2: Enter email/username
  await page.act(`Fill in the email or username field with "${email}"`);
  // Step 3: Click next/continue button
  await page.act("Click the next, continue, or submit button to proceed");
  // Step 4: Enter password
  await page.act(`Fill in the password field with "${password}"`);
  // Step 5: Click login/sign in button
  await page.act("Click the login, sign in, or submit button");
  console.log("🔐 Logged in");
}

async function selectFilters(page: any, activity: string, timeOfDay: string, selectedDate: string): Promise<void> {
  console.log("Selecting the activity");
  // Step 1: Click the activity button
  await page.act(`Click the activites drop down menu`);
  // Step 2: Click the activity button
  await page.act(`Select the ${activity} activity`);
  await page.act(`Click the Done button`);
  // Step 3: Select date
  console.log(`Selecting date: ${selectedDate}`);
  await page.act(`Click the date picker or calendar`);
  // Step 4: Select the specific date by day number
  // Extract day number from YYYY-MM-DD format with validation
  const dateParts = selectedDate.split('-');
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date format: ${selectedDate}. Expected YYYY-MM-DD`);
  }
  
  const dayNumber = parseInt(dateParts[2], 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
    throw new Error(`Invalid day number: ${dayNumber} from date: ${selectedDate}`);
  }
  
  console.log(`Looking for day number: ${dayNumber} in calendar`);
  await page.act(`Click on the number ${dayNumber} in the calendar`);
  // Step 5: Select time of day
  console.log(`Selecting time of day: ${timeOfDay}`);
  await page.act(`Click the time filter or time selection dropdown`);
  // Step 6: Select the specific time period
  await page.act(`Select ${timeOfDay} time period`);
  await page.act(`Click the Done button`);
  // Step 7: Select Available Only button
  await page.act(`Click Available Only button`);
  // Step 8: Click All Facilities dropdown list and select Accept Reservations checkbox
  await page.act(`Click All Facilities dropdown list`);
  await page.act(`Select Accept Reservations checkbox`);
  await page.act(`Click the Done button`);
}

async function checkAndExtractCourts(page: any, timeOfDay: string): Promise<void> {
  console.log("🔍 Checking for available courts...");
  
  // First use observe to check if there are any available courts
  const availableCourts = await page.observe("Find all available court booking slots, time slots, or court reservation options");
  console.log(`Found ${availableCourts.length} available court options`); 
  
  // Extract court data to check availability
  const courtData = await page.extract({
    instruction: "Extract all available court booking information including court names, time slots, locations, and any other relevant details",
    schema: z.object({
      courts: z.array(z.object({
        name: z.string().describe("the name or identifier of the court"),
        openingTimes: z.string().describe("the opening hours or operating times of the court"),
        location: z.string().describe("the location or facility name"),
        availability: z.string().describe("availability status or any restrictions"),
        duration: z.string().nullable().describe("the duration of the court session in minutes")
      }))
    })
  });
  
  // Check if any courts are actually available (not just found)
  let hasAvailableCourts = courtData.courts.some((court: any) => 
    !court.availability.toLowerCase().includes('no free spots') && 
    !court.availability.toLowerCase().includes('unavailable') &&
    !court.availability.toLowerCase().includes('next available') &&
    !court.availability.toLowerCase().includes('the next available reservation')
  );
  
  // If no available courts or all courts are unavailable, try different time of day
  if (availableCourts.length === 0 || !hasAvailableCourts) {
    console.log("❌ No courts available for selected time. Trying different time periods...");
    
    // Try different time periods
    const alternativeTimes = timeOfDay === 'Morning' ? ['Afternoon', 'Evening'] : 
                           timeOfDay === 'Afternoon' ? ['Morning', 'Evening'] : 
                           ['Morning', 'Afternoon'];
    
    for (const altTime of alternativeTimes) {
      console.log(`🔄 Trying ${altTime} time period...`);
      
      await page.act(`Click the time filter dropdown that currently shows "${timeOfDay}"`);
      // Select alternative time from the dropdown
      await page.act(`Select ${altTime} from the time period options`);
      await page.act(`Click the Done button`);
      
      // Check again for available courts
      const altAvailableCourts = await page.observe("Find all available court booking slots, time slots, or court reservation options");
      console.log(`Found ${altAvailableCourts.length} available court options for ${altTime}`);
      
      if (altAvailableCourts.length > 0) {
        // Extract court data to check if they're actually available
        const altCourtData = await page.extract({
          instruction: "Extract all available court booking information including court names, time slots, locations, and any other relevant details",
          schema: z.object({
            courts: z.array(z.object({
              name: z.string().describe("the name or identifier of the court"),
              openingTimes: z.string().describe("the opening hours or operating times of the court"),
              location: z.string().describe("the location or facility name"),
              availability: z.string().describe("availability status or any restrictions"),
              duration: z.string().nullable().describe("the duration of the court session in minutes")
            }))
          })
        });
        
        const hasAltAvailableCourts = altCourtData.courts.some((court: any) => 
          !court.availability.toLowerCase().includes('no free spots') && 
          !court.availability.toLowerCase().includes('unavailable') &&
          !court.availability.toLowerCase().includes('next available') &&
          !court.availability.toLowerCase().includes('the next available reservation')
        );
        
        if (hasAltAvailableCourts) {
          console.log(`✅ Found actually available courts for ${altTime}!`);
          courtData.courts = altCourtData.courts;
          hasAvailableCourts = true;
          break;
        }
      }
    }
  }
  
  if (!hasAvailableCourts) {
    console.log("📋 Extracting final court information...");
    const finalCourtData = await page.extract({
      instruction: "Extract all available court booking information including court names, time slots, locations, and any other relevant details",
      schema: z.object({
        courts: z.array(z.object({
          name: z.string().describe("the name or identifier of the court"),
          openingTimes: z.string().describe("the opening hours or operating times of the court"),
          location: z.string().describe("the location or facility name"),
          availability: z.string().describe("availability status or any restrictions"),
          duration: z.string().nullable().describe("the duration of the court session in minutes")
        }))
      })
    });
    courtData.courts = finalCourtData.courts;
  }
  
  console.log("🏟️ Available Courts:");
  if (courtData.courts && courtData.courts.length > 0) {
    courtData.courts.forEach((court: any, index: number) => {
      console.log(`${index + 1}. ${court.name}`);
      console.log(`   Opening Times: ${court.openingTimes}`);
      console.log(`   Location: ${court.location}`);
      console.log(`   Availability: ${court.availability}`);
      if (court.duration) {
        console.log(`   Duration: ${court.duration} minutes`);
      }
      console.log("");
    });
  } else {
    console.log("❌ No court data available to display");
  }
}

async function bookCourt(page: any): Promise<void> {
  console.log("🎯 Starting court booking process...");
  
  try {
    // Step 1: Click the top available time slot
    console.log("🕐 Clicking the top available time slot...");
    await page.act("Click the first available time slot or court booking option");
    // Step 2: Click on the participant dropdown
    console.log("👥 Opening participant dropdown...");
    await page.act("Click the participant dropdown menu or select participant field");
    await page.act("Click the only named participant in the dropdown!");
    // Step 3: Click the book button
    console.log("Clicking the book button to complete reservation...");
    await page.act("Click the book, reserve, or confirm booking button");
    // Step 4: Click the Send Code Button
    await page.act("Click the Send Code Button");
    
    // Step 5: Wait for user to input the verification code
    const codeAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'verificationCode',
        message: '📱 Please enter the verification code you received:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a verification code';
          }
          return true;
        }
      }
    ]);
    
    console.log(`✅ Verification code: ${codeAnswer.verificationCode}`);
    
    // Step 6: Fill in the verification code
    await page.act(`Fill in the verification code field with "${codeAnswer.verificationCode}"`);
    await page.act("Click the confirm button");
    // Step 7: Check for confirmation
    console.log("✅ Checking for booking confirmation...");
    const confirmation = await page.extract({
      instruction: "Extract any booking confirmation message, success notification, or reservation details",
      schema: z.object({
        confirmationMessage: z.string().nullable().describe("any confirmation or success message"),
        bookingDetails: z.string().nullable().describe("booking details like time, court, etc."),
        errorMessage: z.string().nullable().describe("any error message if booking failed")
      })
    });
    
    if (confirmation.confirmationMessage) {
      console.log(`🎉 Booking confirmed: ${confirmation.confirmationMessage}`);
    }
    if (confirmation.bookingDetails) {
      console.log(`📋 Booking details: ${confirmation.bookingDetails}`);
    }
    if (confirmation.errorMessage) {
      console.log(`❌ Booking error: ${confirmation.errorMessage}`);
    }
    
    console.log("✅ Court booking process completed!");
    
  } catch (error) {
    console.error("❌ Error during court booking:", error);
    throw error;
  }
}

async function selectActivity(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'activity',
      message: '🎾 Please select an activity:',
      choices: [
        { name: 'Tennis', value: 'Tennis' },
        { name: 'Pickleball', value: 'Pickleball' }
      ],
      default: 0
    }
  ]);

  console.log(`✅ Selected: ${answers.activity}`);
  return answers.activity;
}

async function selectTimeOfDay(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'timeOfDay',
      message: '🕐 Please select the time of day:',
      choices: [
        { name: 'Morning (Before 12 PM)', value: 'Morning' },
        { name: 'Afternoon (After 12 PM)', value: 'Afternoon' },
        { name: 'Evening (After 5 PM)', value: 'Evening' }
      ],
      default: 0
    }
  ]);

  console.log(`✅ Selected: ${answers.timeOfDay}`);
  return answers.timeOfDay;
}

async function selectDate(): Promise<string> {
  // Generate the next 7 days from today
  const today = new Date();
  const dateOptions = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const displayName = i === 0 ? `${dayName}, ${monthDay} (Today)` : `${dayName}, ${monthDay}`;
    
    dateOptions.push({
      name: displayName,
      value: fullDate
    });
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedDate',
      message: '📅 Please select a date:',
      choices: dateOptions,
      default: 0
    }
  ]);

  const selectedDate = new Date(answers.selectedDate);
  const displayDate = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  console.log(`✅ Selected: ${displayDate}`);
  return answers.selectedDate;
}

async function bookTennisPaddleCourt() {
  console.log("🎾 Starting tennis/paddle court booking automation in SF...");

  const email = process.env.SF_REC_PARK_EMAIL;
  const password = process.env.SF_REC_PARK_PASSWORD;
  const debugMode = process.env.DEBUG === "true";
  
  const activity = await selectActivity();
  
  // Get date from user input
  const selectedDate = await selectDate();
  
  // Get time of day from user input
  const timeOfDay = await selectTimeOfDay();
  
  
  console.log(`🎾 Booking ${activity} courts in San Francisco for ${timeOfDay} on ${selectedDate}...`);

  if (!email || !password) {
    throw new Error("Missing SF_REC_PARK_EMAIL or SF_REC_PARK_PASSWORD environment variables");
  }

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    experimental: true,
    modelName: "gpt-4o",
    browserbaseSessionCreateParams: {
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      timeout: 900,
      region: "us-west-2"
    }
  });

  try {
    await stagehand.init();
    console.log(`✅ Browserbase Session Started`);
    console.log(`📺 Watch live: https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`);

    const page = stagehand.page;

    console.log("🌐 Navigating to court booking site...");
    await page.goto("https://www.rec.us/organizations/san-francisco-rec-park", {
      waitUntil: 'domcontentloaded', 
      timeout: 60000
    });

  // Step 1: Login with credentials
  await loginToSite(page, email, password);

  // Step 2: Select filters (activity, time, date, and other options)
  await selectFilters(page, activity, timeOfDay, selectedDate);

  // Step 3: Check for available courts and extract court information
  await checkAndExtractCourts(page, timeOfDay);

  // Step 4: Book the court
  await bookCourt(page);
 

  } catch (error) {
    console.error("❌ Error during court booking:", error);
    throw error;
  } finally {
    await stagehand.close();
    console.log("\n👋 Browser session closed");
  }
}

async function main() {
  try {
    await bookTennisPaddleCourt();
    console.log("\n🎉 Tennis/paddle court booking completed successfully!");
  } catch (error) {
    console.error("\n💥 Failed to complete court booking:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
