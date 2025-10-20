#!/usr/bin/env python3
"""
Test script to verify backend connection and endpoints
"""
import requests
import json
import time

def test_backend():
    base_url = "http://localhost:8000"
    
    print("🔍 Testing Backend Connection...")
    print("=" * 50)
    
    # Test 1: Basic connectivity
    try:
        response = requests.get(f"{base_url}/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test endpoint: {data['status']}")
            print(f"   Data points available: {data['data_points']}")
        else:
            print(f"❌ Test endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    # Test 2: Next data endpoint
    try:
        print("\n📊 Testing data endpoints...")
        for i in range(3):
            response = requests.get(f"{base_url}/next_data", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Next data {i+1}: {data['time']} - ${data['value']}")
            else:
                print(f"❌ Next data {i+1} failed: {response.status_code}")
                return False
            time.sleep(0.5)
    except Exception as e:
        print(f"❌ Data endpoint failed: {e}")
        return False
    
    # Test 3: Current data endpoint
    try:
        response = requests.get(f"{base_url}/current_data", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Current data: {data['time']} - ${data['value']}")
        else:
            print(f"❌ Current data failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Current data failed: {e}")
        return False
    
    print("\n🎉 All tests passed! Backend is working correctly.")
    return True

if __name__ == "__main__":
    test_backend()
