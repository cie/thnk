# Thnkfile Specification

The `Thnkfile` is a configuration file used by the Thnk command-line tool to define targets, dependencies, and the recipes for generating files using AI models. Below is the specification for the `Thnkfile` format.

## Structure

A `Thnkfile` consists of multiple entries, each defining a target file, its dependencies, and an optional recipe. The general structure is as follows:

```
target: dependency1 dependency2 ...
    Recipe to generate target from dependencies
```

### Components

1. **Targets**: 
   - A target is the output file that you want to generate. It can be any file type, such as `.txt`, `.json`, etc.
   - Each target must be followed by a colon (`:`).

2. **Dependencies**: 
   - Dependencies are the input files that the target relies on. They can be other target files or source files.
   - Dependencies are listed after the target, separated by spaces.

3. **Recipes**: 
   - A recipe is an indented block of text that serves as a prompt for the AI model to generate the target file.
   - If a recipe is provided directly in the `Thnkfile`, it must be indented under the target definition.
   - Alternatively, you can specify a prompt file (e.g., `prompt.md`) as a dependency, in which case the recipe will be read from that file.

### Special Files

- **Prompt Files**: 
  - You can include a `*.prompt.md` or `prompt.md` file among the dependencies. This file contains the recipe for generating the target.
  
  ```
  target: dependency1 dependency2 my.prompt.md
  ```

- **Schema Files**: 
  - For targets that are JSON files, you can specify a `*.schema.json` or `schema.json` file. This file contains a JSON schema that will be used to validate the output JSON file.
  
  ```
  target.json: dependency1 dependency2 my.schema.json
    Generate a JSON file so that...
  ```

### Example

Here is an example of a `Thnkfile`:

```
output.txt: input1.txt input2.txt
    Generate a text file based on input1 and input2.

data.json: data1.csv data2.csv schema.json
    Generate a JSON file from the CSV data.
```

### Notes

- Each target can have multiple dependencies.
- You cannot have both an inline recipe and a prompt file for the same target.
- The `Thnkfile` must be named `Thnkfile` and placed in the project directory where Thnk is executed.

This specification outlines the basic format and rules for creating a `Thnkfile` to effectively use the Thnk tool for file generation.