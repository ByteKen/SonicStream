/**
 * Root navigation — AuthGate + MiniPlayer overlay.
 */

import React, { useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import MiniPlayer from '../components/MiniPlayer';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import LibraryScreen from '../screens/main/LibraryScreen';
import NowPlayingScreen from '../screens/main/NowPlayingScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Auth navigator ──────────────────────────────────
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ── Bottom tabs ─────────────────────────────────────
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarIcon: ({ color, size }: { color: string; size: number }) => {
        let iconName = 'home';
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Search') iconName = 'search';
        else if (route.name === 'Library') iconName = 'library';
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Library" component={LibraryScreen} />
  </Tab.Navigator>
);

// ── Main navigator (tabs + NowPlaying modal) ────────
const MainNavigator = () => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <View style={styles.main}>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Tabs" component={TabNavigator} />
        <MainStack.Screen
          name="NowPlaying"
          component={NowPlayingScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </MainStack.Navigator>

      {/* MiniPlayer floats above tabs — only shown on the Tabs screen */}
      <MiniPlayer
        onPress={() => {
          navigationRef.current?.navigate('NowPlaying');
        }}
      />
    </View>
  );
};

// ── Root ─────────────────────────────────────────────
const AppNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1 },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;
