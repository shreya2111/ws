#!/usr/bin/env python
import psycopg2
import numpy as np
import math
import os
import os.path
import errno
import urllib2

def getDistance(latitude1, longitude1, latitude2, longitude2):
	earth_radius = 6371
	dLat = np.deg2rad(latitude2-latitude1)
	dLon = np.deg2rad(longitude2-longitude1)
	a = math.pow(math.sin(dLat/2),2) + (math.cos(np.deg2rad(latitude1)) * math.cos(np.deg2rad(latitude2)) * math.sin(dLon/2) * math.sin(dLon/2))
	c = 2 * math.asin(math.sqrt(a))
	d = earth_radius * c
	return(d)

def getLat(latitude, longitude, direction, d):
	earth_radius = 6371
	c = d/earth_radius
	a = math.pow(math.sin(c/2), 2)
	dLat = np.rad2deg(2 * math.asin(math.sqrt(a)))
	if direction == 'N':
		new_Lat = latitude + dLat
	elif direction == 'S':
		new_Lat = latitude - dLat
	else:
		new_Lat = latitude
	return(new_Lat)

def getLng(latitude, longitude, direction, d):
	earth_radius = 6371
	c = d/earth_radius
	a = math.pow(math.sin(c/2), 2)
	dLon = np.rad2deg(2 * math.asin(math.sqrt(a / math.pow(math.cos(np.deg2rad(latitude)), 2) )))
	if direction == 'E':
		new_Lng = longitude + dLon
	elif direction == 'S':
		new_Lng = longitude - dLon
	else:
		new_Lng = longitude
	return(new_Lng)

def make_sure_path_exists(path):
	try:
		os.makedirs(path)
	except OSError as exception:
		if exception.errno != errno.EEXIST:
			raise

def img_fetch():
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
	cur.execute("SELECT \"Folder_Name\" from \"Area_info\" ORDER BY \"Address_ID\" DESC LIMIT 1")
	rows = cur.fetchall()
	#print "\nShow me the databases:\n"
	for row in rows:
		#print "   ", row[0]
		folder_name = row[0]
	conn.close()
	#print getDistance(ne_latitude, ne_longitude, sw_latitude, sw_longitude)
	make_sure_path_exists(os.getcwd()+"/"+folder_name)
	resolution = 0.064 #approximate width of image in meters, i.e. per pixel resolution is around 10cm...
	temp_lat = ne_latitude
	i = 1
	while (temp_lat >= sw_latitude):
		temp_lng = sw_longitude
		j = 1
		while (temp_lng <= ne_longitude):
			nw_lat = temp_lat
			nw_lng = temp_lng
			ne_lat = temp_lat
			ne_lng = getLng(nw_lat, nw_lng, 'E', resolution)
			se_lat = getLat(ne_lat, ne_lng, 'S', resolution)
			se_lng = ne_lng
			sw_lat = se_lat
			sw_lng = nw_lng
			cn_lat = getLat(nw_lat, nw_lng, 'S', resolution/2)
			cn_lng = getLng(nw_lat, nw_lng, 'E', resolution/2)
			
			url  = "https://maps.googleapis.com/maps/api/staticmap?center="+str(cn_lat)+","+str(cn_lng)+"&size=640x640&zoom=20&maptype=satellite&key="+API_console_key
			url2 = "https://maps.googleapis.com/maps/api/staticmap?center="+str(cn_lat)+","+str(cn_lng)+"&size=640x640&zoom=20&maptype=roadmap&key="+API_console_key
			file_url = folder_name+"/AllTheUrls.txt"
			if os.path.isfile(file_url):
				urlText = open(file_url, 'a')
				urlText.write(url+"\n")
				urlText.close()
			else:
				urlText = open(file_url, 'w')
				urlText.write(url+"\n")
				urlText.close()
			while True:
				try:
					make_sure_path_exists(os.getcwd() + "/" + folder_name + "/Satellite")
					data_handle = urllib2.urlopen(url)
					data = data_handle.read()
					file_name = folder_name+"/Satellite/"+str(i)+"_"+str(j)+".png"
					img = open(file_name, 'wb')
					img.write(data)
					img.close()
				except Exception as e:
					print "Caught exception:  " + str(e)
					print "Re-iterating"
					continue
				break
			while True:
				try:
					make_sure_path_exists(os.getcwd() + "/" + folder_name + "/Roadmap")
					data_handle = urllib2.urlopen(url2)
					data = data_handle.read()
					file_name = folder_name+"/Roadmap/"+str(i)+"_"+str(j)+".png"
					img = open(file_name, 'wb')
					img.write(data)
					img.close()
				except Exception as e:
					print "Caught exception:  " + str(e)
					print "Re-iterating"
					continue
				break
			j = j+1
			temp_lng = cn_lng
		s_col = j-1
		i = i+1
		temp_lat = cn_lat
	s_row = i-1
	try:
		conn = psycopg2.connect("dbname='Water24X7' user='postgres' host='localhost' password='anurag")
	except:
		print "I am unable to connect to the database"
	cur = conn.cursor()
	cur.execute("UPDATE \"Area_info\" SET (\"S_Row\", \"S_Col\") = ("+str(s_row)+", "+str(s_col)+") WHERE \"Address_ID\" = (SELECT max(\"Address_ID\") FROM \"Area_info\")")
	conn.commit()
	conn.close()
	return True

