{{/*
Expand the name of the chart.
*/}}
{{- define "caresync.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "caresync.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "caresync.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "caresync.labels" -}}
helm.sh/chart: {{ include "caresync.chart" . }}
{{ include "caresync.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "caresync.selectorLabels" -}}
app.kubernetes.io/name: {{ include "caresync.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "caresync.backend.labels" -}}
{{ include "caresync.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "caresync.backend.selectorLabels" -}}
{{ include "caresync.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "caresync.frontend.labels" -}}
{{ include "caresync.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "caresync.frontend.selectorLabels" -}}
{{ include "caresync.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "caresync.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "caresync.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the proper image name for backend
*/}}
{{- define "caresync.backend.image" -}}
{{- $registryName := .Values.global.imageRegistry | default .Values.image.registry -}}
{{- $repositoryName := .Values.backend.image.repository -}}
{{- $tag := .Values.backend.image.tag | default .Chart.AppVersion -}}
{{- if $registryName }}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else }}
{{- printf "%s:%s" $repositoryName $tag -}}
{{- end }}
{{- end }}

{{/*
Return the proper image name for frontend
*/}}
{{- define "caresync.frontend.image" -}}
{{- $registryName := .Values.global.imageRegistry | default .Values.image.registry -}}
{{- $repositoryName := .Values.frontend.image.repository -}}
{{- $tag := .Values.frontend.image.tag | default .Chart.AppVersion -}}
{{- if $registryName }}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else }}
{{- printf "%s:%s" $repositoryName $tag -}}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL hostname
*/}}
{{- define "caresync.databaseHost" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "caresync.fullname" .) -}}
{{- else }}
{{- .Values.externalDatabase.host -}}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL port
*/}}
{{- define "caresync.databasePort" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "5432" -}}
{{- else }}
{{- .Values.externalDatabase.port | toString -}}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL database name
*/}}
{{- define "caresync.databaseName" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.database -}}
{{- else }}
{{- .Values.externalDatabase.database -}}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL username
*/}}
{{- define "caresync.databaseUser" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.username -}}
{{- else }}
{{- .Values.externalDatabase.user -}}
{{- end }}
{{- end }}

{{/*
Return the database URL
*/}}
{{- define "caresync.databaseUrl" -}}
{{- if .Values.secrets.databaseUrl }}
{{- .Values.secrets.databaseUrl -}}
{{- else }}
{{- printf "postgresql://%s:$(DATABASE_PASSWORD)@%s:%s/%s?schema=public" (include "caresync.databaseUser" .) (include "caresync.databaseHost" .) (include "caresync.databasePort" .) (include "caresync.databaseName" .) -}}
{{- end }}
{{- end }}

{{/*
Return the secret name for database credentials
*/}}
{{- define "caresync.databaseSecretName" -}}
{{- if .Values.externalDatabase.existingSecret }}
{{- .Values.externalDatabase.existingSecret -}}
{{- else }}
{{- printf "%s-db-secret" (include "caresync.fullname" .) -}}
{{- end }}
{{- end }}
