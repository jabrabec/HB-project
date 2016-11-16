import json
import unittest
from model import connect_to_db, db
from server import app
import server


class FlaskTestsBasic(unittest.TestCase):
    """Test basic route responses without database connection."""

    def setUp(self):
        """Stuff to do before every test."""
        self.client = app.test_client()
        app.config['TESTING'] = True

    def test_index(self):
        '''Test that homepage displays correctly.'''

        result = self.client.get('/')
        self.assertIn('<h2>Find a retailer near you:</h2>', result.data)

    def test_yelp(self):
        '''Test that search_yelp_reviews_by_id returns JSON correctly.'''

        result = self.client.get('/search-yelp-reviews.json',
                                 query_string={'yelpID': 'market-mayflower-and-deli-san-francisco'})

        self.assertIn('"id": "market-mayflower-and-deli-san-francisco"', result.data)


class FlaskTestsDatabase(unittest.TestCase):
    """Test route responses with database."""

    def setUp(self):
        """Stuff to do before every test."""
        self.client = app.test_client()
        app.config['TESTING'] = True

        # Connect to test database
        connect_to_db(app, "postgresql:///testdb")

    def tearDown(self):
        """Do at end of every test."""

        db.session.close()

    def test_search_coords_json(self):
        '''Test that search_retailers_by_coords_json route returns correctly.'''

        result = self.client.get('/search-coords.json',
                                 query_string={"latitude": '37.7886679',
                                               "longitude": '-122.411499',
                                               "searchRange": '0.2'})

        self.assertIn('''"Market Mayflower & Deli"''', result.data)

    def test_search_addr_json(self):
        '''Test that search_retailers_by_addr_json route returns correctly.'''

        # result = self.client.get('/search-address.json?street=150+santa+clara+ave&city=oakland&state=CA&searchRange=0.3')
        result = self.client.get('/search-address.json',
                                 query_string={'street': '150 santa clara ave',
                                               'city': 'oakland', 'state': 'CA',
                                               'searchRange': '0.3'})

        self.assertIn('''"Quik Stop Market 8003"''', result.data)


if __name__ == "__main__":
    import unittest

    unittest.main()