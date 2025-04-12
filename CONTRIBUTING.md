
# 🤝 Contributing to Iterable + Google Sheets Integration

Thank you for your interest in contributing! This project thrives on collaboration and community. Whether you're fixing bugs, adding features, or improving docs — you're awesome 🙌

---

## 🛠️ How to Contribute

### 1. **Fork the Repo**

Click the "Fork" button on the top right of this repository page to create your own copy.

### 2. **Clone Your Fork**

```bash
git clone https://github.com/your-username/iterable-google-sheets-integration.git
cd iterable-google-sheets-integration
```

### 3. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
```

Use a descriptive name like:
- `bug/fix-userid-null`
- `feature/add-auth-support`

### 4. **Make Your Changes**

- Code lives in the `src/` folder (Apps Script files)
- Follow naming conventions used in existing code
- Comment clearly if logic is non-obvious
- Test using `clasp push` and Google Sheets

### 5. **Commit & Push**

```bash
git add .
git commit -m "Describe your change"
git push origin feature/your-feature-name
```

### 6. **Open a Pull Request**

Go to your forked repo and click “New Pull Request” to propose your changes.

---

## 🧪 Local Setup for Development

This project uses [`clasp`](https://github.com/google/clasp) to sync code with Google Apps Script.

### 📦 Install `clasp`

```bash
npm install -g @google/clasp
clasp login
```

### 📁 Create or link to a project

```bash
clasp clone <script-id>  # OR
clasp create --type sheets --title "My Dev Project"
```

Then you can:

```bash
clasp push    # Upload code
clasp pull    # Download code
```

---

## 📐 Style Guide

- Use camelCase for variable and function names
- Use `const` and `let` instead of `var`
- Keep functions short and modular
- Prefer native JavaScript unless using Apps Script services

---

## 🧠 Ideas for Contributions

- Add support for more Iterable API endpoints
- Improve error handling or user feedback
- Build a sidebar UI for setup/config
- Translate README into other languages
- Share templates or examples

---

## 📬 Need Help?

Feel free to open an [Issue](https://github.com/YOUR_USERNAME/iterable-google-sheets-integration/issues) with questions, feedback, or ideas.

---

Thanks again for helping improve this project — you're making the community better for everyone 💙
