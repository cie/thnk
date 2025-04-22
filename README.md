# Thnk

Thnk is a command-line tool that automates the process of generating files based on AI models, similar to how Make automates the building of software. It uses a configuration file, akin to a Makefile, to manage dependencies and determine the operations required to generate target files from source files.

**Breaking change in v2**: Thnk no longer uses a Makefile-like syntax, but instead YAML, which makes the file format much more flexible.

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

## Usage

To use Thnk, you need to create a `Thnkfile.yml` in your project directory. This file defines the targets, dependencies, and the AI model configurations needed to generate your files.

Run Thnk in your terminal:

```bash
thnk
```

Thnk will read the `Thnkfile.yml`, check for changes in dependencies, and regenerate the target files if necessary.

## Thnkfile.yml Syntax

A `Thnkfile.yml` uses YAML format to define targets, dependencies, and recipes. Here's a brief overview of its syntax:

- **Targets and Dependencies**: Each target is defined under the `targets` key with its dependencies listed under `needs`.

  ```yaml
  targets:
    output.txt:
      needs:
        - dependency1.txt
        - dependency2.txt
  ```

- **Prompts**: The prompt can be specified directly in the Thnkfile.yml using the `prompt` key, or you can reference an external prompt file using the YAML tag syntax `!file`:

  ```yaml
  targets:
    hello.txt:
      needs:
        - user.json
      prompt: |
        Greet the user
  ```

  ```yaml
  targets:
    hello.txt:
      needs:
        - user.json
      prompt: !file greeting.prompt.md
  ```

- **Generation settings**: You can specify global settings that apply to all targets at the top level, or override them per target:

  ```yaml
  model: gpt-4o
  temperature: 0.7

  targets:
    output.txt:
      model: claude-3.7-sonnet
      temperature: 0.2

      needs:
        - dependency1.txt
  ```

- **Schema files**: For `.json` targets, you can specify a schema file using the YAML tag syntax `!file`:

  ```yaml
  targets:
    output.json:
      needs:
        - data.txt
      prompt: |
        Generate a JSON file from data.txt
      schema: !file my.schema.json
  ```

See the `examples` folder for sample `Thnkfile.yml` configurations.

## Generation settings

Here are the configuration options that can be used globally or per target:

| Option        | Description                   | Default       |
| ------------- | ----------------------------- | ------------- |
| `prompt`      | The prompt to use             | empty string  |
| `schema`      | The JSON schema to use        | no schema     |
| `model`       | The LLM model to use          | `gpt-4o-mini` |
| `temperature` | Controls randomness (0.0-2.0) | `0.0`         |
