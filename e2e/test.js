// e2e/stressTest.js
const { Builder, By, Key } = require('selenium-webdriver');

async function loginAndSearch(userIndex)
{
    const driver = await new Builder().forBrowser('chrome').build();

    try
    {
        await driver.get('http://localhost:4200/auth/login');
        await driver.findElement(By.id('email')).sendKeys('fsd11@gmail.com');
        await driver.findElement(By.id('password')).sendKeys('qq123123');
        await driver.findElement(By.css('.signin-button')).click();

        // Wait for the home page
        await driver.wait(until.titleIs('Home - DevHub'), 5000);

        // Navigate to home page and search
        await driver.get('http://localhost:4200/home');

        // Search input
        await driver.wait(until.elementLocated(By.css('.search-box input')), 5000);

        const searchInput = await driver.findElement(By.css('.search-box input'));
        await searchInput.sendKeys('test issue', Key.RETURN);

        // Wait for a short period to simulate user activity
        await driver.sleep(2000);

    } catch (error)
    {
        console.error(`Error for user ${userIndex}:`, error);
    } finally
    {
        await driver.quit();
    }
}

(async function startStressTest()
{
    const userPromises = [];
    const totalUsers = 300; // Number of users to simulate

    for (let i = 0; i < totalUsers; i++)
    {
        userPromises.push(loginAndSearch(i));
        // Optional: Limit concurrent users to avoid overwhelming resources
        if (i % 10 === 0)
        {
            await Promise.all(userPromises);
            userPromises.length = 0; // Clear the array
        }
    }

    // Wait for the remaining users if any
    await Promise.all(userPromises);
})();