# Thnkfile Specification

The `Thnkfile` is a configuration file used by the Thnk command-line tool to define targets, dependencies, and the recipes for generating files using AI models. Below is the specification for the `Thnkfile` format.

## Structure

A `Thnkfile` consists of multiple entries, each defining a target and its associated dependencies and recipes. The general structure is as follows:

```
target: dependency1 dependency2 ...
    Recipe to generate target from dependencies
```

### Components

1. **Targets**: 
   - A target is the output file that you want to generate. It can be any file type, including `.json`, `.md`, or other formats.
   - Each target must be defined at the beginning of a line, followed by a colon (`:`).

2. **Dependencies**: 
   - Dependencies are the input files that the target relies on. They can be other files or special files like prompts and schemas.
   - Dependencies are listed after the target, separated by spaces.

3. **Recipes**: 
   - A recipe is an indented block of text that serves as a prompt for the AI model to generate the target file.
   - Recipes can also be specified in external files (e.g., `*.prompt.md` or `prompt.md`) included in the dependencies.

### Special Files

- **Prompt Files**: 
  - You can include a prompt file in the dependencies. If a prompt file is specified, the inline recipe in the `Thnkfile` cannot be used.
  - The prompt file should have a `.prompt.md` extension or simply be named `prompt.md`.

- **Schema Files**: 
  - For targets that are JSON files, you can specify a schema file using the `.schema.json` extension. This file defines the structure of the output JSON.
  - Only one schema file can be specified per target.

### Example

Here is an example of a `Thnkfile`:

```
output.json: input1.txt input2.txt my.schema.json
    Generate a JSON file based on input1 and input2

output.md: input1.txt input2.txt my.prompt.md
```

### Notes

- Each target can have multiple dependencies.
- The recipe can be provided inline or through a prompt file, but not both.