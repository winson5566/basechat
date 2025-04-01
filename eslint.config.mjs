import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import _import from "eslint-plugin-import";
import react from "eslint-plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const settings = [
  ...compat.extends("next/core-web-vitals"),
  {
    plugins: {
      react,
    },

    rules: {
      "import/order":
        process.env.DISABLE_IMPORT_ORDER === "true"
          ? "off"
          : [
              "error",
              {
                groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                "newlines-between": "always",

                alphabetize: {
                  order: "asc",
                  caseInsensitive: true,
                },
              },
            ],

      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],
    },
  },
];

export default settings;
