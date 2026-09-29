const { defineConfig, globalIgnores } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')

module.exports = defineConfig([
  globalIgnores([
    'dist/*',
    '.expo/*',
    'node_modules/**',
    'backend/**',
    'coverage/**',
    'eas.json',
    'package-lock.json',
  ]),
  expoConfig,
  eslintPluginPrettierRecommended,
])
