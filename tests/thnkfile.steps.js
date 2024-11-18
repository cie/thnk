const { Given, When, Then } = require('cucumber');

Given('a Thnkfile with a single target', function () {
    // Code to create a Thnkfile with a single target
});

Then('the target is defined correctly', function () {
    // Code to verify that the target is defined correctly
});

Given('a Thnkfile with multiple dependencies', function () {
    // Code to create a Thnkfile with multiple dependencies
});

Then('all dependencies are listed', function () {
    // Code to verify that all dependencies are listed
});

Given('a target with an inline recipe', function () {
    // Code to define a target with an inline recipe
});

Then('the recipe is correctly indented', function () {
    // Code to verify that the recipe is correctly indented
});

Given('a target using a prompt file', function () {
    // Code to define a target using a prompt file
});

Then('the recipe is read from {string}', function (promptFile) {
    // Code to verify that the recipe is read from the specified prompt file
});

Given('a target with a schema file for JSON validation', function () {
    // Code to create a target with a schema file for JSON validation
});

Then('the schema file is specified correctly', function () {
    // Code to verify that the schema file is specified correctly
});

Given('a target with a prompt file and a schema file', function () {
    // Code to create a target with a prompt file and a schema file
});

Then('the prompt file and schema file are both included', function () {
    // Code to verify that both the prompt file and schema file are included
});

Given('a target with both an inline recipe and a prompt file', function () {
    // Code to attempt to define a target with both an inline recipe and a prompt file
});

Then('an error is raised for conflicting definitions', function () {
    // Code to verify that an error is raised for conflicting definitions
});

Given('a Thnkfile without a target', function () {
    // Code to attempt to create a Thnkfile without a target
});

Then('an error is raised indicating that a target is required', function () {
    // Code to verify that an error is raised indicating that a target is required
});

Given('the example Thnkfile provided in the specification', function () {
    // Code to validate the example Thnkfile
});

Then('both targets are defined and recipes are valid', function () {
    // Code to verify that both targets are defined and recipes are valid
});