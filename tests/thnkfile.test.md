## Thnkfile Specification Tests

### Target Definition
1. Create a `Thnkfile` with a single target.
   - `output.txt: input1.txt`
   - Verify that the target is defined correctly.
2. Create a `Thnkfile` with multiple dependencies.
   - `output.txt: input1.txt input2.txt`
   - Verify that all dependencies are listed.

### Recipe Definition
1. Define a target with an inline recipe.
   - `output.txt: input1.txt`
     - Generate a text file based on input1.
   - Verify that the recipe is correctly indented.
2. Define a target using a prompt file.
   - `output.txt: input1.txt my.prompt.md`
   - Verify that the recipe is read from `my.prompt.md`.

### Special Files
1. Create a target with a schema file for JSON validation.
   - `data.json: data1.csv schema.json`
   - Verify that the schema file is specified correctly.
2. Create a target with a prompt file and a schema file.
   - `data.json: data1.csv my.prompt.md schema.json`
   - Verify that the prompt file and schema file are both included.

### Error Handling
1. Attempt to define a target with both an inline recipe and a prompt file.
   - `output.txt: input1.txt my.prompt.md`
     - Generate a text file based on input1.
   - Verify that an error is raised for conflicting definitions.
2. Attempt to create a `Thnkfile` without a target.
   - Verify that an error is raised indicating that a target is required.

### Example Validation
1. Validate the example `Thnkfile` provided in the specification.
   - `output.txt: input1.txt input2.txt`
     - Generate a text file based on input1 and input2.
   - `data.json: data1.csv data2.csv schema.json`
     - Generate a JSON file from the CSV data.
   - Verify that both targets are defined and recipes are valid.