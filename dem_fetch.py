#!/usr/bin/env python
import psycopg2
import numpy as np
import urllib2
import json

def dem_json(output_folder):
	API_console_key = "AIzaSyDZ8Ho-bV4FdQA_nlZSvsr8t_1Lw-PhaEM"
	try:
		conn = psycopg2.connect("dbname='Water24X7' user='postgres' host='localhost' password='anurag'")
	except:
		print "I am unable to connect to the database"
	cur = conn.cursor()
	cur.execute("SELECT \"LatLong\" from \"Area_info\" ORDER BY \"Address_ID\" DESC LIMIT 1")
	rows = cur.fetchall()
	#print "\nShow me the databases:\n"
	for row in rows:
		#print "   ", row[0]
		temp = row[0]
		temp = temp.split(",")
		ne_latitude = float(temp[0].split("(")[1])
		ne_longitude = float(temp[1].split(")")[0])
		sw_latitude = float(temp[2].split("(")[1])
		sw_longitude = float(temp[3].split(")")[0])
	conn.close()
	
	diff_lat = (ne_latitude-sw_latitude)/21
	diff_lng = (ne_longitude-sw_longitude)/21
	temp_lat = ne_latitude
	term_lat = sw_latitude
	temp_lng = sw_longitude
	term_lng = ne_longitude
	
	my_locations = ""
	while temp_lat >= term_lat:
		temp_lng = sw_longitude
		while temp_lng <= term_lng:
			print my_locations
			my_locations  = my_locations + str(temp_lat) + "," + str(temp_lng) + "|"
			temp_lng = temp_lng + diff_lng
		temp_lat = temp_lat - diff_lat
	my_locations = my_locations[0:len(my_locations)-2]
	
	url = "https://maps.googleapis.com/maps/api/elevation/json?locations=" + my_locations + "&key=" + API_console_key
	while True:
		try:
			dem_handle = urllib2.urlopen(url)
			dem = dem_handle.read()
		except Exception as e:
			print "Caught exception:  " + str(e)
			print "Re-iterating"
			continue
		break
	temp = json.loads(dem)
	#print temp["results"][0]["resolution"]
	if temp["status"] == "OK":
		file_dem = output_folder+"/"+"dem.json"
		demData = open(file_dem, 'w')
		demData.write(dem+"\n"+url)
		demData.close()
	
	return True

