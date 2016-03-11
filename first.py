#!/usr/bin/env python
import psycopg2
import numpy as np
import math
import os
import os.path
import errno
import urllib2
import cv2
import image_fetch as imF
import image_stitch as imS
import dem_fetch as demF

howdy = imF.img_fetch()
if howdy:
	try:
		conn = psycopg2.connect("dbname='Water24X7' user='postgres' host='localhost' password='anurag'")
	except:
		print "I am unable to connect to the database"
	cur = conn.cursor()
	cur.execute("SELECT (\"Folder_Name\", \"S_Row\", \"S_Col\") from \"Area_info\" ORDER BY \"Address_ID\" DESC LIMIT 1")
	rows = cur.fetchall()
	for row in rows:
		#print "   ", row[0]
		temp = row[0]
		temp = temp.split(",")
		folder_name = temp[0].split("(")[1]
		s_row = int(temp[1])
		s_col = int(temp[2].split(")")[0])
		#print folder_name
		#print s_row
		#print s_col
	conn.close()
	
	imS.img_stitch(s_row, s_col, folder_name, folder_name)
	
	file_name = folder_name+"/"+"Satellite.png"
	img = open(file_name, 'rb')
	raw_img = psycopg2.Binary( img.read() )
	img.close()
	try:
		conn = psycopg2.connect("dbname='Water24X7' user='postgres' host='localhost' password='anurag'")
	except:
		print "I am unable to connect to the database"
	cur = conn.cursor()
	cur.execute("UPDATE \"Area_info\" SET \"RawMap\" = "+str(raw_img)+" WHERE \"Address_ID\" = (SELECT max(\"Address_ID\") FROM \"Area_info\")")
	conn.commit()
	conn.close()
	
	demF.dem_json(folder_name)