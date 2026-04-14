import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex:1, backgroundColor:'#080808' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f0f0f',
            borderTopColor: 'rgba(201,168,76,0.2)',
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: '#e8c96a',
          tabBarInactiveTintColor: '#7a6a4a',
          tabBarLabelStyle: {
            fontSize: 9,
            letterSpacing: 1.5,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="simulator"
          options={{
            title: 'SIMULATOR',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize:20, opacity: focused ? 1 : 0.6 }}>🎣</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="counter"
          options={{
            title: 'COUNTER',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize:20, opacity: focused ? 1 : 0.6 }}>🦑</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'SETTINGS',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize:20, opacity: focused ? 1 : 0.6 }}>⚙️</Text>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}