import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
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
          </>
        ) : (
          <>
            <Stack.Screen name="StudentMain" component={StudentTabs} />
            <Stack.Screen name="StudentAttendance" component={StudentAttendanceScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Weekly Schedule', headerShown: true }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
