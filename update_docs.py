import re
import sys

def update_reqs():
    req_path = 'docs/02-spec/requirements.md'
    with open(req_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove addendum
    content = re.sub(r'---*\n*## ADDENDUM FASE 3.*', '', content, flags=re.DOTALL)

    # Add new capabilities to Section 1 (Domain)
    new_events = "- BrickOtorgado · InsigniaDesbloqueada · BountyCreado · BountyReclamado\n"
    content = content.replace("- VitrinaCreada", new_events + "- VitrinaCreada")

    new_commands = "- OtorgarBrick (Visitante/Usuario) · ReclamarBounty (Dueño)\n"
    content = content.replace("- CrearVitrina", new_commands + "- CrearVitrina")

    # Add to Section 4 (EARS)
    new_ears = """| R-73 | 2 | Cuando un visitante o usuario pulse "Dar Brick" en un set, el sistema deberá incrementar el contador de bricks del set y registrar la interacción para evitar votos duplicados por IP/sesión. | C8 | Addendum | L3, L6 | v1 |
| R-74 | 5 | Si el sistema detecta que la misma IP o usuario ya otorgó un brick a ese set, entonces deberá ignorar la solicitud de forma idempotente. | C8 | Addendum | L3 | v1 |
| R-75 | 2 | Cuando un usuario publique un set que coincide con un Bounty activo, el sistema deberá marcar el Bounty como reclamado y otorgar la recompensa en bricks al usuario. | C10 | Addendum | L1 | v1 |
| R-76 | 2 | Cuando se actualicen los agregados del usuario, el sistema deberá calcular y asignar Insignias automáticamente según los umbrales predefinidos (ej. sets, piezas). | C9 | Addendum | L1 | v1 |
| R-77 | 1 | El sistema deberá exponer una ruta para recuperar las Exposiciones Temporales activas y los Bounties pendientes para la portada. | C10, C12 | Addendum | L5 | v1 |
"""
    if "| R-73 |" not in content:
        content = content.replace("## 5. Corte", new_ears + "\n## 5. Corte")

    with open(req_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")
    print("Updated requirements.md")

def update_spec():
    spec_path = 'docs/02-spec/spec.md'
    with open(spec_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove addendum
    content = re.sub(r'---*\n*## ADDENDUM FASE 3.*', '', content, flags=re.DOTALL)

    # Inject tables to Data Model
    new_tables = """| bricks_recibidos | id | uuid | público | PK |
| bricks_recibidos | set_id | uuid (FK) | público | |
| bricks_recibidos | hash_visitante | text | personal | IP hasheada para evitar duplicados |
| bounties | id | uuid | público | PK |
| bounties | nombre_set | text | público | |
| bounties | recompensa | int | público | |
| insignias_usuario | id | uuid | público | PK |
| insignias_usuario | usuario_id | uuid (FK) | público | |
| insignias_usuario | insignia | text | público | |
"""
    if "| bricks_recibidos |" not in content:
        content = content.replace("| reportes | id | uuid | público | PK |", new_tables + "| reportes | id | uuid | público | PK |")

    with open(spec_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")
    print("Updated spec.md")

try:
    update_reqs()
    update_spec()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
