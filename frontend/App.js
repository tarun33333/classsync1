import React, { useContext, useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator } from 'react-native';

import CustomSplashScreen from './screens/CustomSplashScreen';
import LoadingScreen from './components/LoadingScreen';

import LoginScreen from './screens/LoginScreen';
import TeacherHomeScreen from './screens/TeacherHomeScreen';
import TeacherSessionScreen from './screens/TeacherSessionScreen';
import TeacherReportsScreen from './screens/TeacherReportsScreen';
import StudentHomeScreen from './screens/StudentHomeScreen';
import StudentAttendanceScreen from './screens/StudentAttendanceScreen';
import StudentHistoryScreen from './screens/StudentHistoryScreen';
import StudentSummaryScreen from './screens/StudentSummaryScreen';
import ProfileScreen from './screens/ProfileScreen';
import TimetableScreen from './screens/TimetableScreen';
import ODApplyScreen from './screens/ODApplyScreen';
import AdvisorDashboard from './screens/AdvisorDashboard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TeacherTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
      else if (route.name === 'Reports') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
      else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: 'blue',
    tabBarInactiveTintColor: 'gray',
  })}>
    <Tab.Screen name="Home" component={TeacherHomeScreen} />
    <Tab.Screen name="Reports" component={TeacherReportsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const StudentTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
      else if (route.name === 'History') iconName = focused ? 'calendar' : 'calendar-outline';
      else if (route.name === 'Summary') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
      else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: 'blue',
    tabBarInactiveTintColor: 'gray',
  })}>
    <Tab.Screen name="Home" component={StudentHomeScreen} />
    <Tab.Screen name="History" component={StudentHistoryScreen} />
    <Tab.Screen name="Summary" component={StudentSummaryScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNav = () => {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen visible={true} message="Authenticating..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userRole === 'teacher' ? (
          <>
            <Stack.Screen name="TeacherMain" component={TeacherTabs} />
            <Stack.Screen name="TeacherSession" component={TeacherSessionScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Weekly Schedule', headerShown: true }} />
            <Stack.Screen name="AdvisorDashboard" component={AdvisorDashboard} options={{ title: 'Pending Approvals', headerShown: true }} />
          </>
        ) : (
          <>
            <Stack.Screen name="StudentMain" component={StudentTabs} />
            <Stack.Screen name="StudentAttendance" component={StudentAttendanceScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Weekly Schedule', headerShown: true }} />
            <Stack.Screen name="ODApply" component={ODApplyScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent auto-hiding the native splash screen
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <CustomSplashScreen onFinish={() => setShowSplash(false)} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
