# Clarity OS

Clarity OS is a robust productivity application built with React Native and Expo, designed to help users structure their lives through clear habits, daily tasks, and larger quests. It prioritizes clarity and consistency over fleeting motivation.

## Features

- **Habits**: Track positive and negative habits with a focus on consistency.
- **Dailies**: Manage recurring daily tasks to build routine.
- **Quests**: Organize one-off tasks and larger projects into actionable items.
- **Stats & Review**: Visualize progress and review weekly performance (Implementation in progress).
- **Gamification**: Light RPG elements (XP, Health) to encourage engagement without being exploitative.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (0.81.5) with [Expo](https://expo.dev/) (~54.0.30)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [React Navigation](https://reactnavigation.org/) (v7)
- **State Management**: React Context & Hooks
- **UI/Animations**: 
    - [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
    - [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native) for icons
- **Storage**: @react-native-async-storage/async-storage

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo Go app on your physical device OR Android Studio / Xcode for emulators.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quest-list.git
   cd quest-list
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npx expo start
```

- **Run on Android**: Press `a` in the terminal (requires Android Studio or connected device).
- **Run on iOS**: Press `i` in the terminal (requires Xcode or connected device).
- **Run on Web**: Press `w` in the terminal.

## Project Structure

```
/src
  /components  - Reusable UI components
  /constants   - Colors, Themes, static data
  /context     - Application state providers
  /hooks       - Custom React hooks
  /navigation  - Navigation configuration
  /screens     - Main screen components
  /services    - API services or logic
  /types.ts    - TypeScript definitions
  /utils       - Helper functions
App.tsx        - Entry point
app.json       - Expo configuration
package.json   - Dependencies and scripts
```

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License.
