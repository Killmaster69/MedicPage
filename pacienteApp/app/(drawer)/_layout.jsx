import { Drawer } from 'expo-router/drawer';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'; 

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { 
          backgroundColor: '#4a90e2',
          elevation: 4,
          shadowOpacity: 0.2,
          height: 60,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#4a90e2',
        drawerInactiveTintColor: '#444',
        drawerLabelStyle: { 
          fontSize: 16,
          fontWeight: '500',
          marginLeft: -20, // Adjust for icon spacing
        },
        drawerActiveBackgroundColor: '#e6f0ff',
        drawerItemStyle: {
          borderRadius: 8,
          paddingVertical: 4,
          marginVertical: 4,
          marginHorizontal: 8,
        },
        drawerStyle: {
          backgroundColor: '#f8f9fa',
          borderRightWidth: 0,
        },
      }}
    >
      <Drawer.Screen 
        name="citas" 
        options={{
          title: "   Mis Citas",
          drawerIcon: ({ color }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="historial" 
        options={{
          title: "   Medicamentos tomados",
          drawerIcon: ({ color }) => (
            <FontAwesome5 name="pills" size={20} color={color} /> // Icono de pastilla
          ),
        }}
      />
      <Drawer.Screen 
        name="reportes" 
        options={{
          title: "   Reportes",
          drawerIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="signos" 
        options={{
          title: "   Signos Vitales",
          drawerIcon: ({ color }) => (
            <Ionicons name="fitness" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="solicitar" 
        options={{
          title: "   Solicitar Cita",
          drawerIcon: ({ color }) => (
            <Ionicons name="add-circle" size={22} color={color} />
          ),
        }}
      />
        <Drawer.Screen 
      name="dashboard" 
      options={{
        title: "   Inicio",
        drawerIcon: ({ color }) => (
          <Ionicons name="exit-outline" size={22} color={color} />
        ),
      }}
    />
      <Drawer.Screen 
      name="logout" 
      options={{
        title: "   Cerrar Sesión",
        drawerIcon: ({ color }) => (
          <Ionicons name="exit-outline" size={22} color={color} />
        ),
      }}
    />
    </Drawer>
  );
}