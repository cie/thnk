# Thnk

Thnk is a command-line tool that automates the process of generating files based on AI models, similar to how Make automates the building of software. It uses a configuration file, akin to a Makefile, to manage dependencies and determine the operations required to generate target files from source files.

### Creating AI generation pipelines

Thnk allows you to create pipelines from subsequent prompts and generations, ensuring that only the necessary files are regenerated. This means that if a dependency changes, Thnk will determine which target files need to be updated, saving time and costs.

Supports OpenAI models' prediction feature, which speeds up re-generation of files with minor changes.

### Version controlling prompts and outputs

Thnk also helps in version controlling of AI prompts with git, allowing you to track changes in your prompt files over time. By committing your prompts and the generated outputs, you can see how modifications to the prompts influence the generated text, aid collaboration and improve reproducibility.

## Installation

To install Thnk, you need Node.js. Once Node.js is installed, you can install Thnk using npm:

```bash
npm install -g thnk
```

Ensure that you have set the `OPENAI_API_KEY` environment variable to use the OpenAI models:

```bash
export OPENAI_API_KEY='your_openai_api_key_here'
```

Optionally, you can set the `OPENAI_MODEL` environment variable to specify the model to use. The default is `gpt-4o-mini`.

```bash
export OPENAI_MODEL='gpt-4o'
```

## Usage

To use Thnk, you need to create a `Thnkfile` in your project directory. This file defines the targets, dependencies, and the AI model configurations needed to generate your files.

Run Thnk in your terminal:

```bash
thnk
```

Thnk will read the `Thnkfile`, check for changes in dependencies, and regenerate the target files if necessary.

## Thnkfile Syntax

A `Thnkfile` consists of targets, dependencies, and recipes. Here’s a brief overview of its syntax:

- **Targets and Dependencies**: Each entry in the Thnkfile specifies a target file and its dependencies.

  ```
  target: dependency1 dependency2
  ```

- **Recipes**: The recipe is an indented block of text that's used as a prompt to generate the target file from the dependencies. Instead of providing the recipe in the Thnkfile, you include a `*.prompt.md` or `prompt.md` file among the dependencies.

  ```
  target: dependency1 dependency2
      Recipe to generate target from dependencies
  ```

  ```
  target: dependency1 dependency2 my.prompt.md
  ```

- **Schema files**: For `.json` targets, you can specify a `*.schema.json` or `schema.json` file containing a JSON schema, this will be used as a schema for the output JSON file.

  ```
  target.json: dependency1 dependency2 my.schema.json
    Generate a JSON file so that...
  ```

See the `examples` folder for sample `Thnkfile` configurations.
