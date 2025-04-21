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

To use Thnk, you need to create a `Thnkfile.yml` in your project directory. This file defines the targets, dependencies, and the AI model configurations needed to generate your files.

Run Thnk in your terminal:

```bash
thnk
```

Thnk will read the `Thnkfile.yml`, check for changes in dependencies, and regenerate the target files if necessary.

## Thnkfile.yml Syntax

A `Thnkfile.yml` uses YAML format to define targets, dependencies, and recipes. Here's a brief overview of its syntax:

- **Targets and Dependencies**: Each target is defined under the `targets` key with its dependencies listed under `deps`:

  ```yaml
  targets:
    output.txt:
      deps:
        - dependency1.txt
        - dependency2.txt
  ```

- **Prompts**: The prompt can be specified directly in the Thnkfile.yml using the `prompt` key, or you can reference an external prompt file using `prompt_file`:

  ```yaml
  targets:
    hello.txt:
      deps:
        - user.json
      prompt: |
        Greet the user
  ```

  ```yaml
  targets:
    hello.txt:
      deps:
        - user.json
      prompt_file: greeting.prompt.md
  ```

- **Schema files**: For `.json` targets, you can specify a schema file using the `schema_file` key:

  ```yaml
  targets:
    output.json:
      deps:
        - data.txt
      prompt: |
        Generate a JSON file from data.txt
      schema_file: my.schema.json
  ```

See the `examples` folder for sample `Thnkfile.yml` configurations.
