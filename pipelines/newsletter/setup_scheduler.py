#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuration automatique de Windows Task Scheduler pour PrizmAI Newsletter
"""

import os
import sys
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timedelta

class SchedulerSetup:
    """Configure l'automatisation via Windows Task Scheduler"""
    
    def __init__(self):
        self.task_name = "PrizmAI_Newsletter"
        self.project_path = Path.cwd()
        self.python_path = sys.executable
        self.script_path = self.project_path / "orchestrator.py"
        
    def create_batch_script(self):
        """Crée un script batch pour lancer la newsletter"""
        batch_content = f"""@echo off
REM PrizmAI Newsletter Launcher
REM Généré automatiquement le {datetime.now().strftime('%Y-%m-%d %H:%M')}

echo ========================================
echo   PrizmAI Newsletter - Execution
echo ========================================
echo.

REM Changer vers le répertoire du projet
cd /d "{self.project_path}"

REM Activer l'environnement virtuel si présent
if exist "venv\\Scripts\\activate.bat" (
    call venv\\Scripts\\activate.bat
)

REM Lancer le script Python
echo [%date% %time%] Démarrage de la génération de newsletter...
"{self.python_path}" "{self.script_path}"

REM Vérifier le code de retour
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Newsletter générée avec succès!
) else (
    echo [%date% %time%] Erreur lors de la génération: Code %ERRORLEVEL%
)

REM Log dans un fichier
echo [%date% %time%] Execution terminée avec code %ERRORLEVEL% >> newsletter_scheduler.log

REM Pause pour voir les résultats en mode manuel
if "%1"=="manual" pause
"""
        
        batch_path = self.project_path / "run_newsletter.bat"
        with open(batch_path, 'w', encoding='utf-8') as f:
            f.write(batch_content)
        
        print(f"✅ Script batch créé: {batch_path}")
        return batch_path
    
    def create_task_xml(self, schedule_time="10:45", schedule_day="Tuesday"):
        """Crée le fichier XML de configuration pour Task Scheduler"""
        
        # Parser l'heure
        hour, minute = schedule_time.split(':')
        
        # Mapping des jours
        days_map = {
            'Monday': 'MON',
            'Tuesday': 'TUE',
            'Wednesday': 'WED',
            'Thursday': 'THU',
            'Friday': 'FRI',
            'Saturday': 'SAT',
            'Sunday': 'SUN'
        }
        
        day_of_week = days_map.get(schedule_day, 'TUE')
        
        xml_content = f"""<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>{datetime.now().isoformat()}</Date>
    <Author>{os.getenv('USERNAME', 'PrizmAI')}</Author>
    <Description>Génération automatique de la newsletter PrizmAI - Collecte d'articles tech/IA, génération de contenu avec GPT-4 et envoi via Mailchimp</Description>
    <URI>\\PrizmAI_Newsletter</URI>
  </RegistrationInfo>
  
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>{datetime.now().strftime('%Y-%m-%d')}T{hour}:{minute}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <DaysOfWeek>
          <{day_of_week} />
        </DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <DisallowStartOnRemoteAppSession>false</DisallowStartOnRemoteAppSession>
    <UseUnifiedSchedulingEngine>true</UseUnifiedSchedulingEngine>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  
  <Actions Context="Author">
    <Exec>
      <Command>{self.project_path}\\run_newsletter.bat</Command>
      <WorkingDirectory>{self.project_path}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""
        
        xml_path = self.project_path / "task_config.xml"
        with open(xml_path, 'w', encoding='utf-16') as f:
            f.write(xml_content)
        
        print(f"✅ Configuration XML créée: {xml_path}")
        return xml_path
    
    def register_task(self, xml_path):
        """Enregistre la tâche dans Windows Task Scheduler"""
        print("\n📅 Enregistrement de la tâche planifiée...")
        
        try:
            # Supprimer la tâche si elle existe déjà
            subprocess.run(['schtasks', '/delete', '/tn', self.task_name, '/f'], 
                         capture_output=True, text=True)
            
            # Créer la nouvelle tâche
            result = subprocess.run(
                ['schtasks', '/create', '/xml', str(xml_path), '/tn', self.task_name],
                capture_output=True, text=True, encoding='utf-8'
            )
            
            if result.returncode == 0:
                print(f"✅ Tâche '{self.task_name}' créée avec succès!")
                return True
            else:
                print(f"❌ Erreur lors de la création: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    def test_task(self):
        """Lance un test immédiat de la tâche"""
        print("\n🧪 Test de la tâche planifiée...")
        
        response = input("Voulez-vous tester la tâche maintenant? (o/n): ").lower()
        if response != 'o':
            return
        
        try:
            print("Lancement du test...")
            result = subprocess.run(
                ['schtasks', '/run', '/tn', self.task_name],
                capture_output=True, text=True
            )
            
            if result.returncode == 0:
                print("✅ Tâche lancée! Vérifiez les logs dans newsletter_scheduler.log")
            else:
                print(f"❌ Erreur: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Erreur lors du test: {e}")
    
    def show_task_info(self):
        """Affiche les informations sur la tâche"""
        print("\n📊 Informations sur la tâche planifiée:")
        
        try:
            result = subprocess.run(
                ['schtasks', '/query', '/tn', self.task_name, '/v', '/fo', 'list'],
                capture_output=True, text=True, encoding='utf-8'
            )
            
            if result.returncode == 0:
                # Extraire les infos importantes
                lines = result.stdout.split('\n')
                important_fields = [
                    'TaskName:', 'Status:', 'Next Run Time:', 
                    'Last Run Time:', 'Last Result:', 'Schedule:'
                ]
                
                for line in lines:
                    for field in important_fields:
                        if field in line:
                            print(f"  {line.strip()}")
                            
            else:
                print("❌ Impossible de récupérer les informations")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
    
    def run(self):
        """Lance le processus complet de configuration"""
        print("🚀 Configuration de l'automatisation PrizmAI Newsletter")
        print("=" * 55)
        
        # Vérifier que nous sommes sur Windows
        if os.name != 'nt':
            print("❌ Ce script ne fonctionne que sur Windows")
            return False
        
        # Demander les préférences de planification
        print("\n⏰ Configuration de la planification:")
        print("Par défaut: Tous les mardis à 10h45")
        
        custom = input("Voulez-vous personnaliser l'horaire? (o/n): ").lower() == 'o'
        
        if custom:
            days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 
                   'Friday', 'Saturday', 'Sunday']
            print("\nJours disponibles:")
            for i, day in enumerate(days, 1):
                print(f"  {i}. {day}")
            
            day_choice = input("Choisissez le jour (1-7): ").strip()
            try:
                schedule_day = days[int(day_choice) - 1]
            except:
                schedule_day = 'Tuesday'
            
            schedule_time = input("Heure (format HH:MM, ex: 10:45): ").strip()
            if not ':' in schedule_time:
                schedule_time = "10:45"
        else:
            schedule_day = 'Tuesday'
            schedule_time = '10:45'
        
        print(f"\n📅 Planification: Tous les {schedule_day}s à {schedule_time}")
        
        # Créer les scripts
        batch_path = self.create_batch_script()
        xml_path = self.create_task_xml(schedule_time, schedule_day)
        
        # Enregistrer la tâche
        if self.register_task(xml_path):
            self.show_task_info()
            self.test_task()
            
            print("\n✅ Automatisation configurée avec succès!")
            print("\n📋 Gestion de la tâche:")
            print(f"  • Voir la tâche: schtasks /query /tn {self.task_name}")
            print(f"  • Lancer manuellement: schtasks /run /tn {self.task_name}")
            print(f"  • Désactiver: schtasks /change /tn {self.task_name} /disable")
            print(f"  • Supprimer: schtasks /delete /tn {self.task_name}")
            
            print("\n📁 Fichiers créés:")
            print(f"  • Script batch: {batch_path}")
            print(f"  • Configuration: {xml_path}")
            print(f"  • Logs: newsletter_scheduler.log")
            
            return True
        else:
            print("\n❌ Échec de la configuration")
            print("Essayez de lancer le script en tant qu'administrateur")
            return False

if __name__ == "__main__":
    setup = SchedulerSetup()
    setup.run()
