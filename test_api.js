const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const BASE_URL = 'http://localhost:4000/api/v1';

async function waitForServer(retries = 20, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`${BASE_URL}/health`);
            if (res.ok) return true;
        } catch (e) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
    return false;
}

async function runTests() {
    console.log('--- STARTING COMPREHENSIVE BACKEND API TEST ---\n');

    const { server } = require('./server');

    const serverReady = await waitForServer();
    if (!serverReady) {
        console.error('Could not connect to server on port 4000');
        process.exit(1);
    }

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passedCount++;
        } else {
            console.error(`[FAIL] ${testName} - ${details}`);
            failedCount++;
        }
    }

    try {
        const resHealth = await fetch(`${BASE_URL}/health`);
        const jsonHealth = await resHealth.json();
        assert(resHealth.status === 200 && jsonHealth.success === true, '1. Health check endpoint responds with 200 OK');

        const ts = Date.now();
        const normalUser = {
            fullName: 'Nguyen Van A',
            age: 22,
            gender: 'male',
            email: `usera_${ts}@example.com`,
            password: 'password123',
            type: 'normal'
        };

        const adminUser = {
            fullName: 'Administrator',
            age: 30,
            gender: 'other',
            email: `admin_${ts}@example.com`,
            password: 'adminpassword123',
            type: 'admin'
        };

        const resRegNormal = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalUser)
        });
        const jsonRegNormal = await resRegNormal.json();
        assert(resRegNormal.status === 201 && jsonRegNormal.success, '2. Register normal user returns 201 Created');
        assert(jsonRegNormal.data && !jsonRegNormal.data.passwordHash, '2b. User response does NOT expose passwordHash');

        const resDup = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalUser)
        });
        assert(resDup.status === 409, '3. Duplicate email registration returns 409 Conflict');

        const resRegAdmin = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminUser)
        });
        const jsonRegAdmin = await resRegAdmin.json();
        assert(resRegAdmin.status === 201 && jsonRegAdmin.data?.type === 'admin', '4. Register admin user returns 201 with type admin');

        const resLoginNormal = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalUser.email, password: normalUser.password })
        });
        const jsonLoginNormal = await resLoginNormal.json();
        const normalToken = jsonLoginNormal.token || jsonLoginNormal.data?.token;
        assert(resLoginNormal.status === 200 && Boolean(normalToken), '5. Login normal user returns JWT token');

        const resLoginAdmin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminUser.email, password: adminUser.password })
        });
        const jsonLoginAdmin = await resLoginAdmin.json();
        const adminToken = jsonLoginAdmin.token || jsonLoginAdmin.data?.token;
        assert(resLoginAdmin.status === 200 && Boolean(adminToken), '6. Login admin user returns JWT token');

        const resMe = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        const jsonMe = await resMe.json();
        assert(resMe.status === 200 && jsonMe.data.email === normalUser.email, '7. GET /auth/me with valid token returns user profile');

        const resMeNoToken = await fetch(`${BASE_URL}/auth/me`);
        assert(resMeNoToken.status === 401, '8. GET /auth/me without token returns 401 Unauthorized');

        const resUpdateProfile = await fetch(`${BASE_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${normalToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName: 'Nguyen Van A Updated', age: 23, gender: 'male' })
        });
        const jsonUpdateProfile = await resUpdateProfile.json();
        assert(resUpdateProfile.status === 200 && jsonUpdateProfile.data.fullName === 'Nguyen Van A Updated', '9. PUT /users/me updates profile successfully');

        const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const sampleBuffer = Buffer.from(samplePngBase64, 'base64');
        const formBlob = new Blob([sampleBuffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('avatar', formBlob, 'test-avatar.png');

        const resUpload = await fetch(`${BASE_URL}/users/me/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${normalToken}` },
            body: formData
        });
        const jsonUpload = await resUpload.json();
        const avatarUrl = jsonUpload.data?.avatarUrl;
        assert(resUpload.status === 200 && Boolean(avatarUrl), '10. POST /users/me/avatar uploads avatar and updates avatarUrl');

        if (avatarUrl) {
            const resStatic = await fetch(avatarUrl);
            assert(resStatic.status === 200, '10b. Uploaded avatar is statically accessible via URL');
        }

        const resCatNormalCreate = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${normalToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: `Test Category ${ts}` })
        });
        assert(resCatNormalCreate.status === 403, '11. Normal user cannot create category (403 Forbidden)');

        const resCatAdminCreate = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: `Electronics ${ts}` })
        });
        const jsonCatAdminCreate = await resCatAdminCreate.json();
        const categoryId = jsonCatAdminCreate.data?.id || jsonCatAdminCreate.data?._id;
        assert(resCatAdminCreate.status === 201 && Boolean(categoryId), '12. Admin user creates category successfully (201 Created)');

        const resListCategories = await fetch(`${BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        const jsonListCategories = await resListCategories.json();
        assert(resListCategories.status === 200 && Array.isArray(jsonListCategories.data), '13. Logged-in user can list categories (200 OK)');

        const resCatNormalUpdate = await fetch(`${BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${normalToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: `Electronics Renamed ${ts}` })
        });
        assert(resCatNormalUpdate.status === 403, '14. Normal user cannot update category (403 Forbidden)');

        const resCatAdminUpdate = await fetch(`${BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: `Smartphones ${ts}` })
        });
        const jsonCatAdminUpdate = await resCatAdminUpdate.json();
        assert(resCatAdminUpdate.status === 200 && jsonCatAdminUpdate.data.name === `Smartphones ${ts}`, '15. Admin user updates category (200 OK)');

        const resProdNormalCreate = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${normalToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'iPhone 16 Pro',
                categoryId: categoryId,
                quantity: 10,
                price: 28000000
            })
        });
        assert(resProdNormalCreate.status === 403, '16. Normal user cannot create product (403 Forbidden)');

        const resProdAdminCreate = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'iPhone 16 Pro Max',
                categoryId: categoryId,
                quantity: 15,
                price: 32000000
            })
        });
        const jsonProdAdminCreate = await resProdAdminCreate.json();
        const productId = jsonProdAdminCreate.data?.id || jsonProdAdminCreate.data?._id;
        assert(resProdAdminCreate.status === 201 && Boolean(productId), '17. Admin user creates product successfully (201 Created)');

        const resListProducts = await fetch(`${BASE_URL}/products`, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        const jsonListProducts = await resListProducts.json();
        assert(resListProducts.status === 200 && Array.isArray(jsonListProducts.data) && jsonListProducts.data.length > 0, '18. Logged-in user can list products (200 OK)');

        const resFilteredProducts = await fetch(`${BASE_URL}/products?categoryId=${categoryId}`, {
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        const jsonFilteredProducts = await resFilteredProducts.json();
        assert(resFilteredProducts.status === 200 && jsonFilteredProducts.data.some(p => (p.id || p._id) === productId), '19. Filter products by categoryId works');

        const resProdNormalUpdate = await fetch(`${BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${normalToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ price: 30000000 })
        });
        assert(resProdNormalUpdate.status === 403, '20. Normal user cannot update product (403 Forbidden)');

        const resProdAdminUpdate = await fetch(`${BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ price: 31000000, quantity: 20 })
        });
        const jsonProdAdminUpdate = await resProdAdminUpdate.json();
        assert(resProdAdminUpdate.status === 200 && jsonProdAdminUpdate.data.price === 31000000, '21. Admin updates product (200 OK)');

        const resProdNormalDelete = await fetch(`${BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        assert(resProdNormalDelete.status === 403, '22. Normal user cannot delete product (403 Forbidden)');

        const resProdAdminDelete = await fetch(`${BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert(resProdAdminDelete.status === 200, '23. Admin deletes product (200 OK)');

        const resCatNormalDelete = await fetch(`${BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${normalToken}` }
        });
        assert(resCatNormalDelete.status === 403, '24. Normal user cannot delete category (403 Forbidden)');

        const resCatAdminDelete = await fetch(`${BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert(resCatAdminDelete.status === 200, '25. Admin deletes category (200 OK)');

    } catch (err) {
        console.error('Test error:', err);
        failedCount++;
    }

    console.log(`\n--- TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED ---`);

    server.close();
    await mongoose.connection.close();
    process.exit(failedCount === 0 ? 0 : 1);
}

runTests();
