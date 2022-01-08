const { getUrl, callApi } = require('./remote');

// TODO restore this api, but probably using the Graphql API
describe.skip('API /meals', () => {
    const meals = [];
    beforeAll(async () => {
        // Commit one meal for tests
        const meal1 = await callApi({
            url: getUrl(['meals'], { "miam": "miam" }),
            method: 'POST',
            body: JSON.stringify({
                "lastTime": 1234567890,
                "name": "Quelque chose a manger",
                "source": "From my mind",
                "rating": 2,
                "comments": "tres tres bon"
            })
        });
        meals.push(JSON.parse(meal1.body));
    });
    afterAll(() => {
        if (meals.length > 0) {
            return Promise.all(
                meals.map(({ id }) => callApi({
                    url: getUrl(['meals', id], { "miam": "miam" }),
                    method: 'DELETE'
                })));
        }
    });

    describe('GET /', () => {
        let result;
        beforeAll(async () => {
            const url = getUrl(['meals']);
            result = await callApi({ url });
        });

        test('is successful', () => {
            const { code } = result;
            expect(code).toBeGreaterThanOrEqual(200);
            expect(code).toBeLessThan(300);
        });

        test('sets unique ids', () => {
            const entries = JSON.parse(result.body);
            expect(entries.length).toBeGreaterThan(0);

            const ids = entries.map(e => e.id);
            expect(ids.length).toEqual(new Set(ids).size);
        });

        test('has data for each meal', () => {
            const entries = JSON.parse(result.body);
            entries.forEach(entry => {
                expect(entry.data).toMatchObject({
                    "count": expect.any(Number),
                    "lastTime": expect.any(Number),
                    "name": expect.any(String),
                    "source": expect.any(String),
                    "rating": expect.any(Number)
                });
            });
        });
    });

    // POST tested by the beforeAll

    describe('PUT /{id}', () => {
        let initialContent;
        let changeResult;
        let updatedContent;

        beforeAll(async () => {
            const listUrl = getUrl(['meals']);
            const initialResult = await callApi({ url: listUrl });
            initialContent = JSON.parse(initialResult.body);

            const { id, data: { rating } } = initialContent[0];
            const url = getUrl(['meals', id], { miam: 'miam' });
            changeResult = await callApi({
                url,
                method: 'PUT',
                body: JSON.stringify({
                    rating: (rating + 2 % 5),
                    comments: 'it must be new',
                    count: 987654321
                })
            });

            const updatedResult = await callApi({ url: listUrl });
            updatedContent = JSON.parse(updatedResult.body);
        });

        test('is successful', () => {
            const { code } = changeResult;
            expect(code).toBeGreaterThanOrEqual(200);
            expect(code).toBeLessThan(300);
        });

        test('returns the updated meal', () => {
            const returnedMeal = JSON.parse(changeResult.body);
            const updatedMeal = updatedContent.find(e => e.id === returnedMeal.id);
            expect(returnedMeal).toEqual(updatedMeal);
        });

        test('updates the value', () => {
            const { id, data } = initialContent[0];
            const { data: { rating, comments, count } } = updatedContent.find(e => e.id === id);

            // Changed attributes
            expect(rating).toEqual((data.rating + 2) % 5);
            expect(comments).toEqual('it must be new');
            // Unchanged attributes
            expect(count).toEqual(data.count);
        });
    });

    describe('PUT /{id}/cooked', () => {
        let initialContent;
        let changeResult;
        let updatedContent;

        beforeAll(async () => {
            const listUrl = getUrl(['meals']);
            const initialResult = await callApi({ url: listUrl });
            initialContent = JSON.parse(initialResult.body);

            const { id } = initialContent[0];
            const url = getUrl(['meals', id, 'cooked'], { miam: 'miam' });
            changeResult = await callApi({
                url,
                method: 'PUT',
                body: JSON.stringify(192837465)
            });

            const updatedResult = await callApi({ url: listUrl });
            updatedContent = JSON.parse(updatedResult.body);
        });

        test('is successful', () => {
            const { code } = changeResult;
            expect(code).toBeGreaterThanOrEqual(200);
            expect(code).toBeLessThan(300);
        });

        test('updates the value', () => {
            const { id, data } = initialContent[0];
            const { data: { rating, comments, count } } = updatedContent.find(e => e.id === id);

            // Changed attributes
            expect(rating).toEqual((data.rating + 2) % 5);
            expect(comments).toEqual('it must be new');
            // Unchanged attributes
            expect(count).toEqual(data.count);
        });
    });

    test('DELETE /{id}', async () => {
        const meal = meals.shift();
        if (!meal) {
            console.log("Nothing to do, no meals");
            return;
        }

        const response = await callApi({
            url: getUrl(['meals', meal.id], { "miam": "miam" }),
            method: 'DELETE'
        });
        expect(response.code).toBeGreaterThanOrEqual(200);
        expect(response.code).toBeLessThan(300);
    });

});
