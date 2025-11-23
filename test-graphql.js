#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

// Load the token from AsyncStorage (we'll need to get it from App.tsx or hardcode for testing)
// For now, let's just test without auth

const testQueries = async () => {
  const API_URL = 'http://192.168.68.103:3000/graphql';
  
  // Sample token - replace with actual token
  const token = process.env.AUTH_TOKEN || '';
  
  const query = `
    query GetAsistenciasTutor($desde: String, $hasta: String) {
      asistenciasTutor(desde: $desde, hasta: $hasta) {
        id
        fecha
        divisionNombre
        gradoNombre
        registros {
          alumnoId
          estado
          observaciones
        }
      }
    }
  `;
  
  const variables = {
    desde: "2024-12-10",
    hasta: "2024-12-17"
  };
  
  const payload = JSON.stringify({
    query,
    variables
  });
  
  console.log('🔍 Testing GraphQL Query: GetAsistenciasTutor');
  console.log('📍 URL:', API_URL);
  console.log('📅 Variables:', variables);
  console.log('🔐 Token:', token ? '✓ Present' : '✗ Missing');
  console.log('');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: '192.168.68.103',
        port: 3000,
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        }
      };
      
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    
    console.log('📤 Status:', response.status);
    console.log('📋 Response Headers:', response.headers);
    console.log('');
    
    try {
      const jsonResponse = JSON.parse(response.body);
      console.log('📦 Response Body:');
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (jsonResponse.data?.asistenciasTutor) {
        console.log('\n✅ Asistencias found:', jsonResponse.data.asistenciasTutor.length, 'records');
      } else if (jsonResponse.errors) {
        console.log('\n❌ GraphQL Errors:', jsonResponse.errors);
      }
    } catch (e) {
      console.log('Raw response:', response.body);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testQueries();

